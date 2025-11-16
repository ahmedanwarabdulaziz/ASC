import { adminDb } from '../lib/firebase-admin';

const BATCH_SIZE = 500;

function normalizePhone(value: any): string {
  const raw = value !== null && value !== undefined ? String(value).trim() : '';
  if (!raw) return '';
  return raw.startsWith('0') ? raw : `0${raw}`;
}

async function normalizePhones() {
  try {
    console.log('Starting phone normalization for all members...');
    const membersRef = adminDb.collection('members');
    const snapshot = await membersRef.get();

    if (snapshot.empty) {
      console.log('No members found.');
      process.exit(0);
    }

    let batch = adminDb.batch();
    let batchCount = 0;
    let updated = 0;

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data() || {};
      const currentMobile = data.mobile || '';
      const currentPhone = data.phone || '';
      const currentLandline = data.landline || data.phone || '';

      const normalizedMobile = normalizePhone(currentMobile);
      const normalizedPhone = normalizePhone(currentPhone);
      const normalizedLandline = normalizePhone(currentLandline);

      const needsUpdate =
        (!!currentMobile && currentMobile !== normalizedMobile) ||
        (!!currentPhone && currentPhone !== normalizedPhone) ||
        (!!currentLandline && currentLandline !== normalizedLandline);

      if (!needsUpdate) {
        return;
      }

      const updateData: any = {};
      if (currentMobile && currentMobile !== normalizedMobile) updateData.mobile = normalizedMobile;
      if (currentPhone && currentPhone !== normalizedPhone) updateData.phone = normalizedPhone;
      if (currentLandline && currentLandline !== normalizedLandline) updateData.landline = normalizedLandline;
      updateData.updatedAt = new Date();

      batch.update(doc.ref, updateData);
      batchCount++;
      updated++;

      if (batchCount >= BATCH_SIZE) {
        batch.commit();
        console.log(`Committed a batch. ${updated} members updated so far...`);
        batch = adminDb.batch();
        batchCount = 0;
      }

      if ((index + 1) % 200 === 0) {
        console.log(`Processed ${index + 1}/${snapshot.size} members...`);
      }
    });

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`\n✅ Normalization completed. Updated ${updated} members.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Normalization error:', error);
    process.exit(1);
  }
}

normalizePhones();


