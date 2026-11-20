import { NextResponse } from 'next/server';
import { mapPgError } from '@/lib/db';
import { requireApiRole } from '@/lib/auth';
import { parseCourseRequest } from '@/lib/courseRequest';
import {
  deleteStoredCourseThumbnailByUrl,
  saveCourseThumbnailFile,
} from '@/lib/courseThumbnailStorage';
import { createTeacherCourse, listTeacherCourses } from '@/lib/queries/courses';

export async function GET() {
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
  if (errorResponse) return errorResponse;

  try {
    const courses = await listTeacherCourses(user.id);
    return NextResponse.json({ success: true, data: { courses } }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat daftar course Anda.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { user, errorResponse } = await requireApiRole(['teacher', 'admin']);
  if (errorResponse) return errorResponse;

  let uploadedThumbnailUrl = null;

  try {
    const parsed = await parseCourseRequest(request);
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const fieldErrors = { ...parsed.validation.fieldErrors };

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
      teacherId: user.id,
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
