'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { CourseCard } from '@/components/course/CourseCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

const LEVEL_OPTIONS = [
  { value: '', label: 'Semua Level' },
  { value: 'pemula', label: 'Pemula' },
  { value: 'menengah', label: 'Menengah' },
  { value: 'lanjut', label: 'Lanjut' },
];

export function CatalogExplorer({
  categories = [],
  initialCourses = [],
  initialPagination = { page: 1, limit: 12, total: 0, totalPages: 1 },
  initialFilters = { q: '', category: '', level: '', sort: 'newest' },
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialFilters.q || '');
  const [category, setCategory] = useState(initialFilters.category || '');
  const [level, setLevel] = useState(initialFilters.level || '');
  const [sort, setSort] = useState(initialFilters.sort || 'newest');
  const [page, setPage] = useState(initialPagination.page || 1);

  const [courses, setCourses] = useState(initialCourses);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isFirstRender = useRef(true);

  const fetchCourses = async (nextParams) => {
    setLoading(true);
    setError('');
    try {
      const sp = new URLSearchParams();
      if (nextParams.q.trim()) sp.set('q', nextParams.q.trim());
      if (nextParams.category) sp.set('category', nextParams.category);
      if (nextParams.level) sp.set('level', nextParams.level);
      if (nextParams.sort && nextParams.sort !== 'newest') sp.set('sort', nextParams.sort);
      if (nextParams.page > 1) sp.set('page', String(nextParams.page));

      const queryStr = sp.toString();
      router.replace(queryStr ? `/courses?${queryStr}` : '/courses', { scroll: false });

      const res = await fetch(`/api/courses?${queryStr}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal memuat katalog.');
      }

      setCourses(json.data.courses || []);
      setPagination(json.data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Gagal memuat data katalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchCourses({ q, category, level, sort, page });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, level, sort, page]);

  const handleReset = () => {
    setQ('');
    setCategory('');
    setLevel('');
    setSort('newest');
    setPage(1);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 min-w-0">
      {/* Interactive Filter Bar */}
      <div className="bg-white rounded-3xl border border-line p-3.5 sm:p-6 shadow-xs -mt-8 relative z-10 space-y-4 w-full min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 min-w-0">
          <div className="min-w-0 sm:col-span-2 lg:col-span-5 relative">
            <label htmlFor="catalog-search" className="sr-only">
              Cari judul atau topik course
            </label>
            <Search
              className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="catalog-search"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Cari materi atau judul course..."
              className="w-full max-w-full min-w-0 min-h-12 pl-11 pr-4 rounded-full border border-slate-500/60 bg-page text-sm sm:text-base text-ink placeholder:text-muted focus:bg-white focus:border-primary-hover"
            />
          </div>

          <div className="min-w-0 lg:col-span-4">
            <label htmlFor="catalog-category" className="sr-only">
              Filter kategori
            </label>
            <select
              id="catalog-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full max-w-full min-w-0 min-h-12 px-4 rounded-full border border-slate-500/60 bg-white text-sm sm:text-base text-ink truncate"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name} ({cat.published_courses_count ?? 0})
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0 lg:col-span-3">
            <label htmlFor="catalog-sort" className="sr-only">
              Urutkan course
            </label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full max-w-full min-w-0 min-h-12 px-4 rounded-full border border-slate-500/60 bg-white text-sm sm:text-base text-ink truncate"
            >
              <option value="newest">Urutkan: Terbaru</option>
              <option value="popular">Urutkan: Terpopuler</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 min-w-0 w-full md:w-auto">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted shrink-0">
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              <span>Level:</span>
            </span>

            <div
              className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 min-w-0 w-full sm:w-auto"
              role="group"
              aria-label="Filter level"
            >
              {LEVEL_OPTIONS.map((opt) => {
                const active = level === opt.value;
                return (
                  <button
                    key={opt.value || 'all'}
                    type="button"
                    onClick={() => {
                      setLevel(opt.value);
                      setPage(1);
                    }}
                    aria-pressed={active}
                    className={`min-h-11 min-w-0 px-3 sm:px-4 rounded-full text-sm font-semibold transition border text-center leading-tight ${
                      active
                        ? 'bg-primary-hover text-white border-primary-hover'
                        : 'bg-page text-ink border-slate-500/50 hover:border-primary-hover'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-sm font-medium text-muted shrink-0">
            Menampilkan <strong className="text-ink">{pagination.total}</strong> course
          </p>
        </div>
      </div>

      {/* Results Area */}
      <div className="mt-8">
        {error ? (
          <div className="rounded-3xl border border-danger/30 bg-danger-light p-6 text-center max-w-xl mx-auto">
            <AlertCircle className="w-8 h-8 text-danger-ink mx-auto mb-2" aria-hidden="true" />
            <p className="text-base font-semibold text-danger-ink">{error}</p>
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={() => fetchCourses({ q, category, level, sort, page })}>
                Coba Muat Ulang
              </Button>
            </div>
          </div>
        ) : loading ? (
          <div
            aria-busy="true"
            aria-label="Memuat daftar course"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-line bg-white overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-line/60" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-line/70 rounded-full w-4/5" />
                  <div className="h-4 bg-line/50 rounded-full w-1/2" />
                  <div className="h-4 bg-line/50 rounded-full w-full mt-6" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            title="Belum ada course yang sesuai"
            description="Tidak ada course yang cocok dengan kata kunci atau filter yang dipilih. Coba atur ulang filter untuk melihat semua course tersedia."
            actionLabel="Reset Filter"
            onAction={handleReset}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <nav
                aria-label="Navigasi halaman katalog"
                className="mt-10 flex flex-wrap items-center justify-center gap-2"
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Sebelumnya</span>
                </Button>

                {Array.from({ length: pagination.totalPages }, (_, idx) => idx + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPage(num)}
                    aria-current={num === pagination.page ? 'page' : undefined}
                    className={`min-h-11 min-w-11 px-4 rounded-full text-sm font-semibold transition border ${
                      num === pagination.page
                        ? 'bg-primary-hover text-white border-primary-hover'
                        : 'bg-white text-ink border-line hover:border-primary'
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
