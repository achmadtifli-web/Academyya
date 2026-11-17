import { listCategoriesWithCounts } from '@/lib/queries/categories';
import { CategoriesClient } from '@/components/admin/CategoriesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelola Kategori',
};

export default async function AdminCategoriesPage() {
  const categories = await listCategoriesWithCounts();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-ink">Kelola Kategori Course</h1>
        <p className="text-base text-muted">
          Kategori yang masih memiliki course terkait tidak dapat dihapus untuk menjaga integritas data.
        </p>
      </div>

      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
