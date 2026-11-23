import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { listCategoriesWithCounts } from '@/lib/queries/categories';
import { searchCatalogCourses } from '@/lib/queries/courses';
import { CatalogExplorer } from '@/components/course/CatalogExplorer';
import { HighlightUnderline } from '@/components/ui/HighlightUnderline';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Katalog Course',
};

export default async function CatalogPage({ searchParams }) {
  const user = await getCurrentUser();
  if (user?.role === 'admin') redirect('/admin');
  if (user?.role === 'teacher') redirect('/teacher');

  const params = await searchParams;
  const q = typeof params?.q === 'string' ? params.q : '';
  const category = typeof params?.category === 'string' ? params.category : '';
  const level = typeof params?.level === 'string' ? params.level : '';
  const sort = params?.sort === 'popular' ? 'popular' : 'newest';
  const page = Number(params?.page) || 1;

  const [categories, initialResult] = await Promise.all([
    listCategoriesWithCounts(),
    searchCatalogCourses({ q, category, level, sort, page, limit: 12 }),
  ]);

  return (
    <main className="flex-1 min-w-0 w-full">
      <section className="bg-white border-b border-line pt-10 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-ink tracking-tight">
            Jelajahi <HighlightUnderline>Katalog</HighlightUnderline> Course
          </h1>
          <p className="text-base sm:text-lg text-muted max-w-2xl">
            Temukan kelas terstruktur sesuai tingkat kemampuan Anda, dari pemula hingga tingkat lanjut.
          </p>
        </div>
      </section>

      <CatalogExplorer
        categories={categories}
        initialCourses={initialResult.courses}
        initialPagination={initialResult.pagination}
        initialFilters={{ q, category, level, sort }}
      />
    </main>
  );
}
