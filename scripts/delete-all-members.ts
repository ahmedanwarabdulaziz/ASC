import { adminDb } from '../lib/firebase-admin';

async function deleteAllMembers() {
  try {
    console.log('Starting deletion of all members...');
    
    const membersRef = adminDb.collection('members');
    const snapshot = await membersRef.get();

    if (snapshot.empty) {
      console.log('No members found. Collection is already empty.');
      process.exit(0);
    }

    console.log(`Found ${snapshot.size} members to delete\n`);

    const BATCH_SIZE = 500;
    let batch = adminDb.batch();
    let batchCount = 0;
    let deleted = 0;

    snapshot.docs.forEach((doc, index) => {
      batch.delete(doc.ref);
      batchCount++;
      deleted++;

      // Commit batch when it reaches the limit
      if (batchCount >= BATCH_SIZE) {
        batch.commit();
        console.log(`Deleted batch: ${deleted} members so far...`);
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

    console.log('\n✅ Deletion completed successfully!');
    console.log(`📊 Total deleted: ${deleted} members`);
    console.log(`\n🎉 Collection is now empty and ready for fresh import!`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Deletion error:', error);
    process.exit(1);
  }
}

// Run the deletion
deleteAllMembers();



