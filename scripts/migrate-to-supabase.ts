import { adminDb } from '../lib/firebase-admin';
import { supabaseAdmin } from '../lib/supabase';
import { normalizeArabic } from '../lib/utils';

async function migrateToSupabase() {
  try {
    console.log('🚀 Starting migration from Firebase to Supabase...\n');
    console.log('📋 IMPORTANT: Please run the SQL from scripts/create-supabase-tables.sql');
    console.log('   in Supabase Dashboard → SQL Editor first!\n');
    console.log('   Waiting 5 seconds for you to set up tables...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 2: Export members from Firebase (in batches to avoid quota)
    console.log('📤 Step 2: Exporting members from Firebase...');
    const membersRef = adminDb.collection('members');
    
    // Get total count first
    const countSnapshot = await membersRef.count().get();
    const totalCount = countSnapshot.data().count;
    console.log(`Found ${totalCount} members in Firebase\n`);
    
    if (totalCount === 0) {
      console.log('❌ No members found in Firebase');
      process.exit(1);
    }

    // Fetch in batches
    const BATCH_SIZE = 500;
    const allMembers: any[] = [];
    let lastDoc: any = null;
    
    while (allMembers.length < totalCount) {
      let query = membersRef.orderBy('__name__').limit(BATCH_SIZE);
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const batch = await query.get();
      if (batch.empty) break;
      
      batch.docs.forEach(doc => {
        allMembers.push({ id: doc.id, ...doc.data() });
      });
      
      lastDoc = batch.docs[batch.docs.length - 1];
      console.log(`Fetched ${allMembers.length}/${totalCount} members...`);
      
      // Small delay to avoid quota
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Exported ${allMembers.length} members from Firebase\n`);

    // Step 3: Transform and import to Supabase
    console.log('📥 Step 3: Importing members to Supabase...');
    
    const members = membersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        member_id: data.memberId || '',
        name: data.name || '',
        name_search: data.nameSearch || normalizeArabic(data.name || ''),
        address: data.address || '',
        address_search: data.addressSearch || normalizeArabic(data.address || ''),
        job: data.job || '',
        job_search: data.jobSearch || normalizeArabic(data.job || ''),
        phone: data.phone || '',
        mobile: data.mobile || '',
        email: data.email || '',
        status: data.status || 'pending',
        notes: data.notes || '',
        team_id: data.teamId || '',
        team_name: data.teamName || '',
        created_at: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updated_at: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
      };
    });

    // Insert in batches of 1000
    const BATCH_SIZE = 1000;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < members.length; i += BATCH_SIZE) {
      const batch = members.slice(i, i + BATCH_SIZE);
      
      const { data, error } = await supabaseAdmin
        .from('members')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(`Error importing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
        errors += batch.length;
      } else {
        imported += batch.length;
        console.log(`Imported batch ${Math.floor(i / BATCH_SIZE) + 1}: ${imported}/${members.length} members`);
      }
    }

    // Step 4: Export teams from Firebase
    console.log('\n📤 Step 4: Exporting teams from Firebase...');
    const teamsRef = adminDb.collection('teams');
    const teamsSnapshot = await teamsRef.get();

    if (!teamsSnapshot.empty) {
      console.log(`Found ${teamsSnapshot.size} teams in Firebase\n`);
      console.log('📥 Step 5: Importing teams to Supabase...');

      const teams = teamsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          name_search: data.nameSearch || normalizeArabic(data.name || ''),
          candidate_id: data.candidateId || '',
          candidate_name: data.candidateName || '',
          members: data.members || [],
          created_at: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        };
      });

      const { error: teamsError } = await supabaseAdmin
        .from('teams')
        .upsert(teams, { onConflict: 'id' });

      if (teamsError) {
        console.error('Error importing teams:', teamsError.message);
      } else {
        console.log(`✅ Imported ${teams.length} teams successfully`);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log(`📊 Members: ${imported} imported, ${errors} errors`);
    console.log(`\n🎉 Data is now in Supabase with full-text search support!`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run the migration
migrateToSupabase();

