import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCourseDetailBySlug } from '@/lib/queries/courses';

export async function GET(_request, context) {
  try {
    const { slug } = await context.params;
    const currentUser = await getCurrentUser();
    const detail = await getCourseDetailBySlug(slug, currentUser);

    if (!detail) {
      return NextResponse.json(
        { success: false, error: 'Course tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: detail }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat detail course.' },
      { status: 500 }
    );
  }
}
