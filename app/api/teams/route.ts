import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { normalizeArabic } from '@/lib/utils';

// GET - Get all teams
export async function GET() {
  try {
    const teamsRef = adminDb.collection('teams');
    const snapshot = await teamsRef.get();
    
    const teams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }));

    return NextResponse.json({ success: true, teams });
  } catch (error: any) {
    return NextResponse.json(
      { error: `خطأ: ${error.message}` },
      { status: 500 }
    );
  }
}

// POST - Create a new team
export async function POST(request: NextRequest) {
  try {
    const { name, candidateId, candidateName } = await request.json();

    if (!name || !candidateId || !candidateName) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة غير مكتملة' },
        { status: 400 }
      );
    }

    const teamData = {
      name,
      nameSearch: normalizeArabic(name),
      candidateId,
      candidateName,
      members: [],
      createdAt: new Date(),
    };

    const docRef = await adminDb.collection('teams').add(teamData);

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الفريق بنجاح',
      teamId: docRef.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `خطأ: ${error.message}` },
      { status: 500 }
    );
  }
}




