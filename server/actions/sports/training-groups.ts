'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/server/permissions/require-permission';
import { PERMISSIONS } from '@/types/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type FacilityConflictRow = {
  facility_areas?: { name?: string | null } | null;
  training_groups?: { name?: string | null } | null;
};

type TrainingGroupWithLevel = {
  sport_id: string;
  sector_id: string;
  level_id: string | null;
  sport_levels?: { name?: string | null } | { name?: string | null }[] | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : JSON.stringify(error);
}

function getGroupLevelName(group: TrainingGroupWithLevel) {
  if (Array.isArray(group.sport_levels)) {
    return group.sport_levels[0]?.name || null;
  }

  return group.sport_levels?.name || null;
}

export async function getTrainingGroupsData() {
  await requirePermission(PERMISSIONS.TRAINING_GROUPS_VIEW);
  const supabase = await createClient();

  const [groupsRes, sportsRes, sectorsRes, ageGroupsRes, levelsRes, staffRes, areasRes] = await Promise.all([
    supabase
      .from('training_groups')
      .select(
        '*, training_group_coaches(*, staff_members(id, people:person_id(first_name, last_name))), training_group_sessions(*), training_group_enrollments(*, sport_players(id, people:person_id(first_name, second_name, last_name, national_id)))',
      )
      .order('created_at', { ascending: false }),
    supabase.from('sports').select('id, name').order('name'),
    supabase.from('sport_sectors').select('id, sport_id, name'),
    supabase.from('sport_age_groups').select('id, sport_id, name'),
    supabase.from('sport_levels').select('id, sport_id, name'),
    supabase
      .from('staff_members')
      .select('id, status, people:person_id(first_name, second_name, last_name), staff_jobs!inner(is_training_sector)')
      .eq('status', 'active')
      .eq('staff_jobs.is_training_sector', true),
    supabase.from('facility_areas').select('id, facility_id, name, sports_facilities(name)').eq('is_active', true),
  ]);

  if (groupsRes.error) {
    console.error(
      'Error fetching training groups:',
      groupsRes.error.message,
      groupsRes.error.details,
      groupsRes.error.hint,
      groupsRes.error.code,
    );

    return {
      success: false,
      error: `حدث خطأ أثناء جلب المجموعات التدريبية: ${groupsRes.error.message || JSON.stringify(groupsRes.error)}`,
    };
  }

  if (staffRes.error) {
    console.error(
      'Error fetching staff members:',
      staffRes.error.message,
      staffRes.error.details,
      staffRes.error.hint,
      staffRes.error.code,
    );
  }

  return {
    success: true,
    data: {
      groups: groupsRes.data || [],
      sports: sportsRes.data || [],
      sectors: sectorsRes.data || [],
      ageGroups: ageGroupsRes.data || [],
      levels: levelsRes.data || [],
      staff: staffRes.data || [],
      areas: areasRes.data || [],
    },
  };
}

const trainingGroupSchema = z.object({
  sportId: z.string().uuid('يجب اختيار اللعبة الرياضية'),
  sectorId: z.string().uuid('يجب اختيار القطاع'),
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  ageGroupId: z.string().uuid().optional().nullable(),
  levelId: z.string().uuid().optional().nullable(),
  maxPlayers: z.coerce.number().int().positive('يجب إدخال العدد الأقصى للاعبين'),
  status: z.enum(['draft', 'active', 'paused', 'archived']),
  notes: z.string().optional().nullable(),
});

const updateTrainingGroupSchema = trainingGroupSchema.extend({
  groupId: z.string().uuid('المجموعة غير صالحة'),
});

export async function createTrainingGroup(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.TRAINING_GROUPS_MANAGE);

    const parsed = trainingGroupSchema.safeParse({
      sportId: formData.get('sportId'),
      sectorId: formData.get('sectorId'),
      name: formData.get('name'),
      ageGroupId: formData.get('ageGroupId') || null,
      levelId: formData.get('levelId') || null,
      maxPlayers: formData.get('maxPlayers'),
      status: formData.get('status') || 'draft',
      notes: formData.get('notes') || null,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' };
    }

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('training_groups').insert({
      sport_id: parsed.data.sportId,
      sector_id: parsed.data.sectorId,
      name: parsed.data.name,
      age_group_id: parsed.data.ageGroupId,
      level_id: parsed.data.levelId,
      max_players: parsed.data.maxPlayers,
      status: parsed.data.status,
      notes: parsed.data.notes,
    });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'يوجد مجموعة بهذا الاسم في نفس القطاع.' };
      }

      return { success: false, error: 'حدث خطأ أثناء إضافة المجموعة.' };
    }

    revalidatePath('/system/sports/training-groups');
    revalidatePath('/system/sports/players');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error creating group:', error);
    return { success: false, error: `حدث خطأ غير متوقع: ${getErrorMessage(error)}` };
  }
}

export async function updateTrainingGroupSettings(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.TRAINING_GROUPS_MANAGE);

    const parsed = updateTrainingGroupSchema.safeParse({
      groupId: formData.get('groupId'),
      sportId: formData.get('sportId'),
      sectorId: formData.get('sectorId'),
      name: formData.get('name'),
      ageGroupId: formData.get('ageGroupId') || null,
      levelId: formData.get('levelId') || null,
      maxPlayers: formData.get('maxPlayers'),
      status: formData.get('status'),
      notes: formData.get('notes') || null,
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'بيانات غير صالحة' };
    }

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('training_groups')
      .update({
        sport_id: parsed.data.sportId,
        sector_id: parsed.data.sectorId,
        name: parsed.data.name,
        age_group_id: parsed.data.ageGroupId,
        level_id: parsed.data.levelId,
        max_players: parsed.data.maxPlayers,
        status: parsed.data.status,
        notes: parsed.data.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.groupId);

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'يوجد مجموعة أخرى بنفس الاسم في هذا القطاع.' };
      }

      return { success: false, error: 'حدث خطأ أثناء تعديل بيانات المجموعة.' };
    }

    revalidatePath('/system/sports/training-groups');
    revalidatePath('/system/sports/players');
    return { success: true, message: 'تم تحديث إعدادات المجموعة التدريبية.' };
  } catch (error: unknown) {
    console.error('Error updating training group settings:', error);
    return { success: false, error: `حدث خطأ غير متوقع: ${getErrorMessage(error)}` };
  }
}

export async function addGroupCoach(groupId: string, staffId: string, role: string) {
  try {
    await requirePermission(PERMISSIONS.TRAINING_GROUPS_MANAGE);
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin.from('training_group_coaches').insert({
      training_group_id: groupId,
      staff_member_id: staffId,
      role,
    });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'هذا المدرب مضاف بالفعل لهذه المجموعة.' };
      }

      return { success: false, error: 'حدث خطأ أثناء تعيين المدرب.' };
    }

    revalidatePath('/system/sports/training-groups');
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: `حدث خطأ غير متوقع: ${getErrorMessage(error)}` };
  }
}

export async function removeGroupCoach(coachAssignmentId: string) {
  try {
    await requirePermission(PERMISSIONS.TRAINING_GROUPS_MANAGE);
    const supabaseAdmin = createAdminClient();

    await supabaseAdmin.from('training_group_coaches').delete().eq('id', coachAssignmentId);
    revalidatePath('/system/sports/training-groups');
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: `حدث خطأ غير متوقع: ${getErrorMessage(error)}` };
  }
}

export async function addGroupSession(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.TRAINING_GROUPS_MANAGE);
    const supabaseAdmin = createAdminClient();

    const groupId = formData.get('groupId') as string;
    const dayOfWeek = parseInt(formData.get('dayOfWeek') as string, 10);
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const areaIds = formData.getAll('areaId') as string[];

    if (!areaIds || areaIds.length === 0) {
      return { success: false, error: 'يجب اختيار ساحة رياضية واحدة على الأقل.' };
    }

    const { data: facilityConflicts, error: facilityConflictError } = await supabaseAdmin
      .from('training_group_sessions')
      .select('facility_areas(name), training_groups(name)')
      .in('facility_area_id', areaIds)
      .eq('day_of_week', dayOfWeek)
      .lt('start_time', endTime)
      .gt('end_time', startTime);

    if (facilityConflictError) {
      console.error('Error checking facility conflicts:', facilityConflictError);
      return { success: false, error: 'حدث خطأ أثناء التحقق من تعارض الساحات.' };
    }

    if (facilityConflicts && facilityConflicts.length > 0) {
      const conflict = facilityConflicts[0] as FacilityConflictRow;
      const areaName = conflict.facility_areas?.name || 'الساحة المختارة';
      const groupName = conflict.training_groups?.name || 'مجموعة أخرى';

      return {
        success: false,
        error: `لا يمكن الحجز. (${areaName}) محجوزة بالفعل للمجموعة (${groupName}) في هذا الوقت.`,
      };
    }

    const { data: areasData } = await supabaseAdmin.from('facility_areas').select('facility_id').in('id', areaIds);
    const facilityIds = [...new Set(areasData?.map((area) => area.facility_id) || [])];

    if (facilityIds.length > 0) {
      const { data: opHours } = await supabaseAdmin
        .from('facility_operating_hours')
        .select('*')
        .in('facility_id', facilityIds)
        .eq('day_of_week', dayOfWeek)
        .eq('status', 'available')
        .lte('start_time', startTime)
        .gte('end_time', endTime);

      for (const facilityId of facilityIds) {
        const hasCoverage = opHours?.some((hour) => hour.facility_id === facilityId);
        if (!hasCoverage) {
          return { success: false, error: 'المنشأة غير متاحة بالكامل في هذا الوقت. راجع ساعات التشغيل المعتمدة.' };
        }
      }
    }

    const { data: groupConflicts, error: groupConflictError } = await supabaseAdmin
      .from('training_group_sessions')
      .select('id')
      .eq('training_group_id', groupId)
      .eq('day_of_week', dayOfWeek)
      .lt('start_time', endTime)
      .gt('end_time', startTime);

    if (groupConflictError) {
      console.error('Error checking group conflicts:', groupConflictError);
      return { success: false, error: 'حدث خطأ أثناء التحقق من جدول المجموعة.' };
    }

    if (groupConflicts && groupConflicts.length > 0) {
      return {
        success: false,
        error: 'هذه المجموعة لديها تدريب بالفعل في هذا الوقت. احذف الموعد القديم أولًا إذا كنت تريد التعديل.',
      };
    }

    const sessionsToInsert = areaIds.map((areaId) => ({
      training_group_id: groupId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      facility_area_id: areaId,
    }));

    const { error } = await supabaseAdmin.from('training_group_sessions').insert(sessionsToInsert);

    if (error) {
      console.error('Session Insert Error:', error);
      return { success: false, error: 'حدث خطأ أثناء إضافة الموعد. تأكد من عدم وجود تعارض.' };
    }

    revalidatePath('/system/sports/training-groups');
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: `حدث خطأ غير متوقع: ${getErrorMessage(error)}` };
  }
}

export async function removeGroupSession(sessionId: string) {
  try {
    await requirePermission(PERMISSIONS.TRAINING_GROUPS_MANAGE);
    const supabaseAdmin = createAdminClient();

    await supabaseAdmin.from('training_group_sessions').delete().eq('id', sessionId);
    revalidatePath('/system/sports/training-groups');
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: `حدث خطأ غير متوقع: ${getErrorMessage(error)}` };
  }
}

export async function enrollPlayerToGroup(formData: FormData) {
  try {
    await requirePermission(PERMISSIONS.TRAINING_GROUPS_ENROLL);
    const supabaseAdmin = createAdminClient();

    const groupId = formData.get('groupId') as string;
    const playerId = formData.get('playerId') as string;
    const effectiveDate = (formData.get('effectiveDate') as string) || new Date().toISOString().split('T')[0];

    if (!groupId || !playerId) {
      return { success: false, error: 'يجب اختيار اللاعب والمجموعة التدريبية.' };
    }

    const { data: player } = await supabaseAdmin
      .from('sport_players')
      .select('person_id, sport_id, current_level_id')
      .eq('id', playerId)
      .single();

    if (!player) {
      return { success: false, error: 'اللاعب غير موجود.' };
    }

    const { data: group } = await supabaseAdmin
      .from('training_groups')
      .select('sport_id, sector_id, level_id, sport_levels(name)')
      .eq('id', groupId)
      .single<TrainingGroupWithLevel>();

    if (!group) {
      return { success: false, error: 'المجموعة التدريبية غير موجودة.' };
    }

    if (player.sport_id !== group.sport_id) {
      return { success: false, error: 'لا يمكن تسجيل اللاعب في مجموعة تخص لعبة مختلفة.' };
    }

    const [{ data: isMedicalApproved }, { data: isEligible }, { data: hasCapacity }] = await Promise.all([
      supabaseAdmin.rpc('check_medical_approval', { p_person_id: player.person_id, p_sector_id: group.sector_id }),
      supabaseAdmin.rpc('check_enrollment_eligibility', { p_person_id: player.person_id, p_training_group_id: groupId }),
      supabaseAdmin.rpc('check_group_capacity', { p_training_group_id: groupId }),
    ]);

    if (!isMedicalApproved) {
      return { success: false, error: 'لا يمكن تسجيل اللاعب في مجموعة تدريبية قبل وجود موافقة طبية سارية.' };
    }

    if (!isEligible) {
      return { success: false, error: 'اللاعب غير مؤهل لهذه المجموعة. تأكد من أن عمره يقع ضمن الحدود السنية للمجموعة وأنه يستوفي شروط القطاع (مثل العضوية الفعّالة لقطاع البطولة).' };
    }

    if (!hasCapacity) {
      return { success: false, error: 'المجموعة مكتملة العدد.' };
    }

    let levelAdjustmentMessage: string | null = null;

    if (group.level_id && player.current_level_id !== group.level_id) {
      const { error: updateLevelError } = await supabaseAdmin
        .from('sport_players')
        .update({
          current_level_id: group.level_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', playerId);

      if (updateLevelError) {
        console.error('Error auto-updating player level during enrollment:', updateLevelError);
        return { success: false, error: 'تعذر تعديل مستوى اللاعب تلقائيًا ليتوافق مع المجموعة.' };
      }

      const { error: historyError } = await supabaseAdmin.from('player_level_history').insert({
        sport_player_id: playerId,
        sport_id: player.sport_id,
        from_level_id: player.current_level_id,
        to_level_id: group.level_id,
        reason: 'تعديل تلقائي للمستوى أثناء التسجيل في مجموعة تدريبية',
      });

      if (historyError) {
        console.error('Error logging player level history during enrollment:', historyError);
        return { success: false, error: 'تم إيقاف التسجيل لأن حفظ سجل تعديل المستوى لم يكتمل.' };
      }

      const groupLevelName = getGroupLevelName(group);
      levelAdjustmentMessage = groupLevelName
        ? `تم تعديل مستوى اللاعب تلقائيًا إلى (${groupLevelName}) ليتوافق مع المجموعة التدريبية.`
        : 'تم تعديل مستوى اللاعب تلقائيًا ليتوافق مع المجموعة التدريبية.';
    }

    const { data: existing } = await supabaseAdmin
      .from('training_group_enrollments')
      .select('id')
      .eq('sport_player_id', playerId)
      .eq('training_group_id', groupId)
      .eq('status', 'active');

    if (existing && existing.length > 0) {
      return { success: false, error: 'اللاعب مشترك بالفعل في هذه المجموعة.' };
    }

    const { error } = await supabaseAdmin.from('training_group_enrollments').insert({
      training_group_id: groupId,
      sport_player_id: playerId,
      status: 'active',
      enrolled_at: effectiveDate,
    });

    if (error) {
      console.error('Error enrolling player:', error);
      return { success: false, error: 'حدث خطأ أثناء تسجيل اللاعب في المجموعة.' };
    }

    revalidatePath('/system/sports/training-groups');
    revalidatePath('/system/sports/players');
    return {
      success: true,
      message: levelAdjustmentMessage || 'تم تسجيل اللاعب في المجموعة التدريبية.',
    };
  } catch (error: unknown) {
    return { success: false, error: `حدث خطأ غير متوقع: ${getErrorMessage(error)}` };
  }
}

export async function cancelPlayerGroupEnrollment(enrollmentId: string, endedAt?: string) {
  try {
    await requirePermission(PERMISSIONS.TRAINING_GROUPS_ENROLL);
    const supabaseAdmin = createAdminClient();

    if (!enrollmentId) {
      return { success: false, error: 'يجب تحديد الاشتراك المراد إلغاؤه.' };
    }

    const { data: enrollment, error: fetchError } = await supabaseAdmin
      .from('training_group_enrollments')
      .select('id, status')
      .eq('id', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      return { success: false, error: 'اشتراك المجموعة غير موجود.' };
    }

    if (enrollment.status !== 'active') {
      return { success: false, error: 'لا يمكن إلغاء اشتراك غير نشط.' };
    }

    const { error: updateError } = await supabaseAdmin
      .from('training_group_enrollments')
      .update({
        status: 'ended',
        ended_at: endedAt || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId);

    if (updateError) {
      console.error('Error cancelling player group enrollment:', updateError);
      return { success: false, error: 'حدث خطأ أثناء إلغاء الاشتراك.' };
    }

    revalidatePath('/system/sports/training-groups');
    revalidatePath('/system/sports/players');
    return { success: true, message: 'تم إلغاء اشتراك اللاعب في المجموعة التدريبية.' };
  } catch (error: unknown) {
    return { success: false, error: `حدث خطأ غير متوقع: ${getErrorMessage(error)}` };
  }
}
