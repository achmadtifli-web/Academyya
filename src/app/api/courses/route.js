import { NextResponse } from 'next/server';
import { searchCatalogCourses } from '@/lib/queries/courses';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const result = await searchCatalogCourses({
      q: searchParams.get('q'),
      category: searchParams.get('category'),
      level: searchParams.get('level'),
      sort: searchParams.get('sort') || 'newest',
      page: Number(searchParams.get('page')) || 1,
      limit: Number(searchParams.get('limit')) || 12,
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Gagal memuat katalog course.' },
      { status: 500 }
    );
  }
}
