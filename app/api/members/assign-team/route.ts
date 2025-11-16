import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { memberId, teamId } = await request.json();

    if (!memberId || !teamId) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة غير مكتملة' },
        { status: 400 }
      );
    }

    // Get team info
    const teamDoc = await adminDb.collection('teams').doc(teamId).get();
    if (!teamDoc.exists) {
      return NextResponse.json(
        { error: 'الفريق غير موجود' },
        { status: 404 }
      );
    }

    const teamData = teamDoc.data()!;

    // Update member
    await adminDb.collection('members').doc(memberId).update({
      teamId,
      teamName: teamData.name,
      updatedAt: new Date(),
    });

    // Update team members array
    const currentMembers = teamData.members || [];
    if (!currentMembers.includes(memberId)) {
      await adminDb.collection('teams').doc(teamId).update({
        members: [...currentMembers, memberId],
      });
    }

    return NextResponse.json({
      success: true,
      message: 'تم تعيين العضو للفريق بنجاح',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `خطأ: ${error.message}` },
      { status: 500 }
    );
  }
}



