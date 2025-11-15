import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { adminDb } from '@/lib/firebase-admin';
import { normalizeArabic, generateSearchTokens } from '@/lib/utils';

// Firestore batch limit is 500 operations
const BATCH_SIZE = 500;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم رفع ملف' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'الملف فارغ' }, { status: 400 });
    }

    const membersRef = adminDb.collection('members');
    let count = 0;
    let batch = adminDb.batch();
    let batchCount = 0;

    // Process each row
    for (const row of data as any[]) {
      // Find name field (could be in different columns)
      const nameField = Object.keys(row).find(key => 
        key.toLowerCase().includes('name') || 
        key.toLowerCase().includes('اسم') ||
        key.toLowerCase().includes('الاسم')
      );

      if (!nameField || !row[nameField]) {
        continue; // Skip rows without names
      }

      const name = String(row[nameField]).trim();
      if (!name) continue;

      // Extract other common fields
      const email = row.email || row['البريد الإلكتروني'] || row['Email'] || row['E-mail'] || '';
      const phone = row.phone || row['الهاتف'] || row['رقم الهاتف'] || row['Phone'] || row['Mobile'] || '';

      // Generate search tokens for fast Arabic search
      const nameTokens = generateSearchTokens(name);
      const emailTokens = email ? generateSearchTokens(email) : [];
      const phoneTokens = phone ? generateSearchTokens(phone) : [];
      const allSearchTokens = [...nameTokens, ...emailTokens, ...phoneTokens];

      // Create member document with optimized structure
      const memberData = {
        name,
        nameSearch: normalizeArabic(name),
        searchTokens: allSearchTokens, // Array for fast Firestore array-contains queries
        email: email,
        phone: phone,
        status: 'pending' as const,
        notes: '',
        teamId: '',
        teamName: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        // Store all original Excel data (flattened for easy access)
        ...Object.fromEntries(
          Object.entries(row).map(([key, value]) => {
            // Clean key names and store values
            const cleanKey = String(key).trim();
            const cleanValue = value !== null && value !== undefined ? String(value).trim() : '';
            return [cleanKey, cleanValue];
          })
        ),
      };

      const docRef = membersRef.doc();
      batch.set(docRef, memberData);
      count++;
      batchCount++;

      // Commit batch when it reaches the limit
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = adminDb.batch();
        batchCount = 0;
      }
    }

    // Commit remaining operations
    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      message: `تم استيراد ${count} عضو بنجاح`,
      count 
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: `خطأ في الاستيراد: ${error.message}` },
      { status: 500 }
    );
  }
}

