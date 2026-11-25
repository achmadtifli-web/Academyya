import { NextResponse } from 'next/server';
import { mapPgError } from '@/lib/db';
import { parseCourseRequest } from '@/lib/courseRequest';
import {
  deleteStoredCourseThumbnailByUrl,
  saveCourseThumbnailFile,
} from '@/lib/courseThumbnailStorage';
import {
  createTeacherCourse,
  finalizeCourseById,
  updateCourseDetails,
} from '@/lib/queries/courses';
import { findTeacherById } from '@/lib/queries/users';

export async function handleCreateCourseMutation(request, user, { allowSelectTeacher = false } = {}) {
  let uploadedThumbnailUrl = null;

  try {
    const parsed = await parseCourseRequest(request, {
      requireTeacherId: allowSelectTeacher,
    });
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const fieldErrors = { ...parsed.validation.fieldErrors };

    let targetTeacherId = user.id;
    if (allowSelectTeacher && !fieldErrors.teacher_id) {
      const teacher = await findTeacherById(parsed.validation.data.teacher_id);
      if (!teacher) {
        fieldErrors.teacher_id = 'Pengajar (Teacher) yang dipilih tidak valid.';
      } else {
        targetTeacherId = teacher.id;
      }
    }

    if (parsed.thumbnailFile && Object.keys(fieldErrors).length === 0) {
      const uploadRes = await saveCourseThumbnailFile(user.id, parsed.thumbnailFile);
      if (uploadRes.error) {
        fieldErrors.thumbnail = uploadRes.error;
      } else {
        uploadedThumbnailUrl = uploadRes.thumbnailUrl;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Periksa kembali formulir course.',
          fieldErrors,
        },
        { status: 400 }
      );
    }

    const course = await createTeacherCourse({
      teacherId: targetTeacherId,
      ...parsed.validation.data,
      thumbnail_url: uploadedThumbnailUrl || parsed.validation.data.thumbnail_url,
    });

    return NextResponse.json(
      { success: true, data: { course }, message: 'Course draft berhasil dibuat.' },
      { status: 201 }
    );
  } catch (err) {
    if (uploadedThumbnailUrl) {
      await deleteStoredCourseThumbnailByUrl(uploadedThumbnailUrl);
    }
    const mapped = mapPgError(err);
    if (mapped) {
      return NextResponse.json({ success: false, error: mapped.error }, { status: mapped.status });
    }
    return NextResponse.json(
      { success: false, error: 'Gagal membuat course baru.' },
      { status: 500 }
    );
  }
}

export async function handleUpdateCourseMutation(
  request,
  user,
  existingCourse,
  { allowSelectTeacher = false } = {}
) {
  let uploadedThumbnailUrl = null;

  try {
    const parsed = await parseCourseRequest(request, {
      requireTeacherId: allowSelectTeacher,
    });
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    let nextStatus = existingCourse.status;
    if (parsed.rawStatus === 'published' || parsed.rawStatus === 'draft') {
      nextStatus = parsed.rawStatus;
    }
    if (nextStatus === 'draft' && existingCourse.finalized_at) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course yang sudah difinalisasi tidak dapat dikembalikan ke status draft.',
        },
        { status: 400 }
      );
    }
    if (nextStatus === 'published' && existingCourse.total_materials < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tambahkan minimal 1 materi sebelum mempublikasikan course.',
        },
        { status: 400 }
      );
    }

    const fieldErrors = { ...parsed.validation.fieldErrors };

    let nextTeacherId = existingCourse.teacher_id;
    if (allowSelectTeacher && !fieldErrors.teacher_id) {
      const teacher = await findTeacherById(parsed.validation.data.teacher_id);
      if (!teacher) {
        fieldErrors.teacher_id = 'Pengajar (Teacher) yang dipilih tidak valid.';
      } else {
        nextTeacherId = teacher.id;
      }
    }

    if (parsed.thumbnailFile && Object.keys(fieldErrors).length === 0) {
      const uploadRes = await saveCourseThumbnailFile(user.id, parsed.thumbnailFile);
      if (uploadRes.error) {
        fieldErrors.thumbnail = uploadRes.error;
      } else {
        uploadedThumbnailUrl = uploadRes.thumbnailUrl;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Periksa kembali formulir course.',
          fieldErrors,
        },
        { status: 400 }
      );
    }

    const nextThumbnailUrl = uploadedThumbnailUrl
      ? uploadedThumbnailUrl
      : parsed.removeThumbnail
      ? null
      : parsed.hasThumbnailUrlField
      ? parsed.validation.data.thumbnail_url
      : existingCourse.thumbnail_url || null;

    const updated = await updateCourseDetails(existingCourse.id, {
      ...parsed.validation.data,
      teacher_id: nextTeacherId,
      thumbnail_url: nextThumbnailUrl,
      status: nextStatus,
    });

    if (existingCourse.thumbnail_url && existingCourse.thumbnail_url !== nextThumbnailUrl) {
      await deleteStoredCourseThumbnailByUrl(existingCourse.thumbnail_url);
    }

    return NextResponse.json(
      { success: true, data: { course: updated }, message: 'Perubahan course berhasil disimpan.' },
      { status: 200 }
    );
  } catch (err) {
    if (uploadedThumbnailUrl) {
      await deleteStoredCourseThumbnailByUrl(uploadedThumbnailUrl);
    }
    const mapped = mapPgError(err);
    if (mapped) {
      return NextResponse.json({ success: false, error: mapped.error }, { status: mapped.status });
    }
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui course.' },
      { status: 500 }
    );
  }
}

/**
 * Shared handler for PATCH /api/teacher/courses/[id] and /api/admin/courses/[id]
 * supporting both status moderation (draft/published) and course finalization.
 */
export async function handleCoursePatchAction(courseId, existingCourse, body) {
  if (body?.action === 'finalize') {
    const result = await finalizeCourseById(courseId);
    if (result.status === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'Course tidak ditemukan.' },
        { status: 404 }
      );
    }
    if (result.status === 'ALREADY_FINALIZED') {
      return NextResponse.json(
        { success: false, error: 'Course ini sudah difinalisasi sebelumnya.' },
        { status: 400 }
      );
    }
    if (result.status === 'NOT_PUBLISHED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Publikasikan course terlebih dahulu sebelum melakukan finalisasi.',
        },
        { status: 400 }
      );
    }
    if (result.status === 'NO_MATERIALS') {
      return NextResponse.json(
        {
          success: false,
          error: 'Course harus memiliki minimal 1 materi sebelum dapat difinalisasi.',
        },
        { status: 400 }
      );
    }

    const message =
      result.issued_count > 0
        ? `Course berhasil difinalisasi dan ${result.issued_count} sertifikat siswa diterbitkan.`
        : 'Course berhasil difinalisasi. Materi kini terkunci dan sertifikat aktif untuk siswa yang lulus 100%.';

    return NextResponse.json(
      {
        success: true,
        data: { course: result.course, issued_count: result.issued_count },
        message,
      },
      { status: 200 }
    );
  }

  const nextStatus = body?.status;
  if (!['draft', 'published'].includes(nextStatus)) {
    return NextResponse.json(
      { success: false, error: 'Status course harus draft atau published.' },
      { status: 400 }
    );
  }

  if (nextStatus === 'draft' && existingCourse.finalized_at) {
    return NextResponse.json(
      {
        success: false,
        error: 'Course yang sudah difinalisasi tidak dapat dikembalikan ke status draft.',
      },
      { status: 400 }
    );
  }

  if (nextStatus === 'published' && existingCourse.total_materials < 1) {
    return NextResponse.json(
      {
        success: false,
        error: 'Course harus memiliki minimal 1 materi sebelum dapat dipublikasikan.',
      },
      { status: 400 }
    );
  }

  const updated = await updateCourseDetails(courseId, { status: nextStatus });
  return NextResponse.json(
    {
      success: true,
      data: { course: updated },
      message:
        nextStatus === 'published'
          ? 'Course berhasil dipublikasikan ke katalog.'
          : 'Course dikembalikan ke status draft.',
    },
    { status: 200 }
  );
}
