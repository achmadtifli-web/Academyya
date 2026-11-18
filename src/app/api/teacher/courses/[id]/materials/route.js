import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import { getCourseById } from '@/lib/queries/courses';
import {
  addMaterialToCourse,
  listMaterialsForCourse,
  reorderCourseMaterials,
} from '@/lib/queries/materials';
import { parsePositiveInt, validateMaterialPayload } from '@/lib/validators';

async function verifyCourseOwnership(courseId, user) {
  const course = await getCourseById(courseId);
  if (!course) {
    return {
      course: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Course tidak ditemukan.' },
        { status: 404 }
      ),
    };
  }
  if (user.role !== 'admin' && Number(course.teacher_id) !== Number(user.id)) {
    return {
      course: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses ke materi course ini.' },
        { status: 403 }
      ),
    };
  }
  return { course, errorResponse: null };
}

export async function GET(_request, context) {
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
  if (errorResponse) return errorResponse;

  const { id } = await context.params;
  const courseId = parsePositiveInt(id);
  if (!courseId) {
    return NextResponse.json({ success: false, error: 'ID course tidak valid.' }, { status: 400 });
  }

  const check = await verifyCourseOwnership(courseId, user);
  if (check.errorResponse) return check.errorResponse;

  const materials = await listMaterialsForCourse(courseId);
  return NextResponse.json({ success: true, data: { materials } }, { status: 200 });
}

export async function POST(request, context) {
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const courseId = parsePositiveInt(id);
    if (!courseId) {
      return NextResponse.json({ success: false, error: 'ID course tidak valid.' }, { status: 400 });
    }

    const check = await verifyCourseOwnership(courseId, user);
    if (check.errorResponse) return check.errorResponse;

    const body = await request.json().catch(() => null);
    const validation = validateMaterialPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Periksa kembali formulir materi.',
          fieldErrors: validation.fieldErrors,
        },
        { status: 400 }
      );
    }

    const material = await addMaterialToCourse(courseId, validation.data);
    return NextResponse.json(
      { success: true, data: { material }, message: 'Materi baru berhasil ditambahkan.' },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal menambahkan materi baru.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, context) {
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const courseId = parsePositiveInt(id);
    if (!courseId) {
      return NextResponse.json({ success: false, error: 'ID course tidak valid.' }, { status: 400 });
    }

    const check = await verifyCourseOwnership(courseId, user);
    if (check.errorResponse) return check.errorResponse;

    const body = await request.json().catch(() => null);
    const orderedIds = Array.isArray(body?.orderedIds)
      ? body.orderedIds.map((item) => parsePositiveInt(item))
      : null;

    if (!orderedIds || orderedIds.some((val) => !val)) {
      return NextResponse.json(
        { success: false, error: 'Daftar urutan materi tidak valid.' },
        { status: 400 }
      );
    }

    const existing = await listMaterialsForCourse(courseId);
    const existingSet = new Set(existing.map((m) => Number(m.id)));
    const incomingSet = new Set(orderedIds.map((val) => Number(val)));

    if (
      existingSet.size !== incomingSet.size ||
      [...existingSet].some((existingId) => !incomingSet.has(existingId))
    ) {
      return NextResponse.json(
        { success: false, error: 'Daftar ID materi tidak cocok dengan materi pada course ini.' },
        { status: 400 }
      );
    }

    await reorderCourseMaterials(courseId, orderedIds);
    const materials = await listMaterialsForCourse(courseId);
    return NextResponse.json(
      { success: true, data: { materials }, message: 'Urutan materi berhasil disimpan.' },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui urutan materi.' },
      { status: 500 }
    );
  }
}
