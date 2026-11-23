import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth';
import { deleteStoredAvatarByUrl } from '@/lib/avatarStorage';
import { deleteUserByAdmin } from '@/lib/queries/users';
import { parsePositiveInt } from '@/lib/validators';

function formatTeacherBlockedMessage(publishedCourses, activeCourseEnrollments) {
  if (publishedCourses > 0 && activeCourseEnrollments > 0) {
    return `Akun teacher tidak dapat dihapus karena masih memiliki ${publishedCourses} course published dan ${activeCourseEnrollments} siswa yang sedang aktif belajar.`;
  }
  if (publishedCourses > 0) {
    return `Akun teacher tidak dapat dihapus karena masih memiliki ${publishedCourses} course berstatus published. Turunkan ke draft atau hapus course terkait terlebih dahulu.`;
  }
  return `Akun teacher tidak dapat dihapus karena masih ada ${activeCourseEnrollments} siswa yang sedang aktif belajar di course miliknya.`;
}

export async function DELETE(_request, context) {
  const { user, errorResponse } = await requireApiRole(['admin']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const targetId = parsePositiveInt(id);
    if (!targetId) {
      return NextResponse.json(
        { success: false, error: 'ID pengguna tidak valid.' },
        { status: 400 }
      );
    }

    if (Number(targetId) === Number(user.id)) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri.' },
        { status: 400 }
      );
    }

    const result = await deleteUserByAdmin(targetId);
    if (result.status === 'NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (result.user.avatar_url) {
      await deleteStoredAvatarByUrl(result.user.avatar_url);
    }

    return NextResponse.json(
      {
        success: true,
        data: { deleted: { id: result.user.id, name: result.user.name, email: result.user.email } },
        message: 'Akun pengguna berhasil dihapus.',
      },
      { status: 200 }
    );
  } catch (err) {
    if (err?.code === 'USER_HAS_ACTIVE_ENROLLMENTS') {
      const subject = err.role === 'student' ? 'Akun student' : 'Akun pengguna';
      return NextResponse.json(
        {
          success: false,
          error: `${subject} tidak dapat dihapus karena masih mengikuti ${err.count} course aktif.`,
        },
        { status: 409 }
      );
    }

    if (err?.code === 'TEACHER_HAS_ACTIVE_COURSES') {
      return NextResponse.json(
        {
          success: false,
          error: formatTeacherBlockedMessage(
            err.publishedCourses,
            err.activeCourseEnrollments
          ),
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Gagal menghapus pengguna.' },
      { status: 500 }
    );
  }
}
