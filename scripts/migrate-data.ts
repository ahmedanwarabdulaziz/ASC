import { adminDb } from '../lib/firebase-admin';
import { normalizeArabic, generateSearchTokens } from '../lib/utils';

const BATCH_SIZE = 500;

async function migrateData() {
  try {
    console.log('Starting data migration...');
    console.log('This will update existing records with proper field names.\n');

    const normalizePhone = (value: any) => {
      const raw = value !== null && value !== undefined ? String(value).trim() : '';
      if (!raw) return '';
      return raw.startsWith('0') ? raw : `0${raw}`;
    };

    const membersRef = adminDb.collection('members');
    const snapshot = await membersRef.get();

    if (snapshot.empty) {
      console.log('No members found to migrate.');
      process.exit(0);
    }

    console.log(`Found ${snapshot.size} members to migrate\n`);

    let batch = adminDb.batch();
    let batchCount = 0;
    let updated = 0;
    let skipped = 0;

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      
      // Check if already migrated (has memberId field and proper structure)
      if (data.memberId && data.address !== undefined) {
        skipped++;
        return;
      }

      // Extract data from old structure
      // The old structure has name as memberId (from __EMPTY)
      // We need to get the actual data from __EMPTY_1, __EMPTY_2, etc.
      
      const oldName = data.name || '';
      const oldEmpty = data['__EMPTY'] || '';
      const oldEmpty1 = data['__EMPTY_1'] || '';
      const oldEmpty2 = data['__EMPTY_2'] || '';
      const oldEmpty3 = data['__EMPTY_3'] || '';
      const oldEmpty4 = data['__EMPTY_4'] || '';
      const oldEmpty5 = data['__EMPTY_5'] || '';

      // Determine correct values
      // If name is a number (like "1254"), it's actually the memberId
      // The real name should be in __EMPTY_1
      let memberId = '';
      let name = '';
      
      if (/^\d+$/.test(oldName)) {
        // Name field contains a number (memberId)
        memberId = oldName;
        name = oldEmpty1 || oldEmpty || '';
      } else {
        // Try to get from __EMPTY fields
        memberId = oldEmpty || (oldName.match(/^\d+/) ? oldName : '');
        name = oldEmpty1 || oldName;
      }

      if (!name || name.length === 0) {
        skipped++;
        return;
      }

      const address = oldEmpty2 || '';
      const job = oldEmpty3 || '';
      const landline = normalizePhone(oldEmpty4 || '');
      const mobile = normalizePhone(oldEmpty5 || '');

      // Generate search tokens
      const nameTokens = generateSearchTokens(name);
      const memberIdTokens = memberId ? generateSearchTokens(memberId) : [];
      const mobileTokens = mobile ? generateSearchTokens(mobile) : [];
      const allSearchTokens = [...nameTokens, ...memberIdTokens, ...mobileTokens];

      // Update document with proper field names
      const updateData: any = {
        memberId: memberId,
        name: name,
        nameSearch: normalizeArabic(name),
        searchTokens: allSearchTokens,
        address: address,
        job: job,
        landline: landline,
        mobile: mobile,
        phone: mobile || normalizePhone(data.phone || ''),
        updatedAt: new Date(),
      };

      // Keep existing fields that are already correct
      if (data.email) updateData.email = data.email;
      if (data.status) updateData.status = data.status;
      if (data.notes) updateData.notes = data.notes;
      if (data.teamId) updateData.teamId = data.teamId;
      if (data.teamName) updateData.teamName = data.teamName;
      if (data.createdAt) updateData.createdAt = data.createdAt;

      batch.update(doc.ref, updateData);
      batchCount++;
      updated++;

      // Commit batch when it reaches the limit
      if (batchCount >= BATCH_SIZE) {
        batch.commit();
        console.log(`Migrated batch: ${updated} members updated so far...`);
        batch = adminDb.batch();
        batchCount = 0;
      }

      // Progress indicator
      if ((index + 1) % 100 === 0) {
        console.log(`Processed ${index + 1}/${snapshot.size} members...`);
      }
    });

    // Commit remaining operations
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log('\n✅ Migration completed successfully!');
    console.log(`📊 Total updated: ${updated} members`);
    console.log(`⏭️  Skipped: ${skipped} members (already migrated or no name)`);
    console.log(`\n🎉 All data now has proper field names!`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run the migration
migrateData();



