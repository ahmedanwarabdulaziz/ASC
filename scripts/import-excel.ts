import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { adminDb } from '../lib/firebase-admin';
import { normalizeArabic, generateSearchTokens } from '../lib/utils';

const BATCH_SIZE = 500;

async function importExcel() {
  try {
    console.log('Starting Excel import...');
    
    // Read Excel file
    const excelPath = path.join(process.cwd(), 'ASC .xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.error('Excel file not found at:', excelPath);
      process.exit(1);
    }

    console.log('Reading Excel file...');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      console.error('Excel file is empty');
      process.exit(1);
    }

    console.log(`Found ${data.length} rows in Excel file`);
    
    // Show first row to see column structure
    if (data.length > 0) {
      console.log('\n📋 Excel columns detected:');
      const firstRow = data[0] as any;
      const keys = Object.keys(firstRow);
      keys.forEach((key, idx) => {
        console.log(`  Column ${idx + 1} (${key}): "${firstRow[key]}"`);
      });
      console.log('');
    }

    const membersRef = adminDb.collection('members');
    let count = 0;
    let batch = adminDb.batch();
    let batchCount = 0;
    let skipped = 0;

    console.log('✅ Column mapping:');
    console.log('   Column A → memberId');
    console.log('   Column B → name');
    console.log('   Column C → address');
    console.log('   Column D → job');
    console.log('   Column E → phone (landline)');
    console.log('   Column F → mobile\n');
    console.log('Processing rows...\n');

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      
      // Map Excel columns A-F to proper field names
      // Excel columns are typically: __EMPTY (A), __EMPTY_1 (B), __EMPTY_2 (C), etc.
      const memberId = String(row['__EMPTY'] || '').trim();
      const name = String(row['__EMPTY_1'] || '').trim();
      const address = String(row['__EMPTY_2'] || '').trim();
      const job = String(row['__EMPTY_3'] || '').trim();
      const phone = String(row['__EMPTY_4'] || '').trim(); // Column E - landline
      const mobile = String(row['__EMPTY_5'] || '').trim(); // Column F - mobile
      
      // Skip rows without name
      if (!name || name.length === 0) {
        skipped++;
        continue;
      }

      // Generate search tokens for professional Arabic search
      // Include: name, address, job, mobile for comprehensive search
      const nameTokens = generateSearchTokens(name);
      const addressTokens = address ? generateSearchTokens(address) : [];
      const jobTokens = job ? generateSearchTokens(job) : [];
      const mobileTokens = mobile ? generateSearchTokens(mobile) : [];
      const memberIdTokens = memberId ? generateSearchTokens(memberId) : [];
      
      // Combine all search tokens
      const allSearchTokens = [
        ...nameTokens,
        ...addressTokens,
        ...jobTokens,
        ...mobileTokens,
        ...memberIdTokens
      ];

      // Create member document with proper field names
      const memberData = {
        memberId: memberId,
        name: name,
        nameSearch: normalizeArabic(name),
        address: address,
        addressSearch: address ? normalizeArabic(address) : '',
        job: job,
        jobSearch: job ? normalizeArabic(job) : '',
        phone: phone, // Landline (Column E)
        mobile: mobile, // Mobile (Column F)
        searchTokens: allSearchTokens, // Comprehensive search tokens
        email: '',
        status: 'pending' as const,
        notes: '',
        teamId: '',
        teamName: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = membersRef.doc();
      batch.set(docRef, memberData);
      count++;
      batchCount++;

      // Commit batch when it reaches the limit
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`Imported batch: ${count} members so far...`);
        batch = adminDb.batch();
        batchCount = 0;
      }

      // Progress indicator
      if ((i + 1) % 100 === 0) {
        console.log(`Processed ${i + 1}/${data.length} rows...`);
      }
    }

    // Commit remaining operations
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log('\n✅ Import completed successfully!');
    console.log(`📊 Total imported: ${count} members`);
    console.log(`⏭️  Skipped: ${skipped} rows (no name found)`);
    console.log(`\n🎉 Data is now in Firebase and ready to use!`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Import error:', error);
    process.exit(1);
  }
}

// Run the import
importExcel();

