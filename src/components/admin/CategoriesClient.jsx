'use client';

import { useState } from 'react';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { InputField, SelectField, TextareaField } from '@/components/ui/Input';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';

const ICON_OPTIONS = [
  'Code',
  'Palette',
  'Briefcase',
  'ShieldCheck',
  'Languages',
  'Globe',
  'BookOpen',
];

export function CategoriesClient({ initialCategories = [] }) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState(initialCategories);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('BookOpen');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setIcon('BookOpen');
    setFieldErrors({});
    setFormOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setIcon(cat.icon || 'BookOpen');
    setFieldErrors({});
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});

    try {
      const url = editing ? `/api/categories/${editing.id}` : '/api/categories';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, icon }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        throw new Error(json.error || 'Gagal menyimpan kategori.');
      }

      if (editing) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editing.id ? { ...c, ...json.data.category } : c
          )
        );
      } else {
        setCategories((prev) => [
          ...prev,
          { ...json.data.category, published_courses_count: 0, total_courses_count: 0 },
        ]);
      }

      showToast({ type: 'success', message: json.message });
      setFormOpen(false);
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal menyimpan kategori.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus kategori.');
      }

      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      showToast({ type: 'success', message: json.message });
      setDeleteTarget(null);
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Gagal menghapus kategori.' });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-base text-muted">
          Total <strong className="text-ink">{categories.length}</strong> kategori aktif di platform.
        </p>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>Tambah Kategori</span>
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="Belum ada kategori"
          description="Tambahkan kategori pertama untuk mengelompokkan course di katalog."
          actionLabel="Tambah Kategori"
          onAction={openCreate}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-3xl bg-white border border-line overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-page border-b border-line text-sm font-semibold text-muted">
                <tr>
                  <th className="py-4 px-5">Kategori</th>
                  <th className="py-4 px-5">Slug</th>
                  <th className="py-4 px-5">Total Course</th>
                  <th className="py-4 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-base">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-page/50">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-primary-light text-primary-dark flex items-center justify-center shrink-0">
                          <CategoryIcon name={cat.icon} className="w-5 h-5" />
                        </span>
                        <div>
                          <p className="font-semibold text-ink">{cat.name}</p>
                          {cat.description && (
                            <p className="text-sm text-muted line-clamp-1">{cat.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-sm text-muted">{cat.slug}</td>
                    <td className="py-4 px-5 text-sm font-semibold text-ink">
                      {cat.total_courses_count ?? 0} course
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(cat)}>
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="dangerOutline"
                          size="sm"
                          onClick={() => setDeleteTarget(cat)}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                          <span>Hapus</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="md:hidden space-y-3">
            {categories.map((cat) => (
              <div key={cat.id} className="rounded-3xl bg-white border border-line p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-primary-light text-primary-dark flex items-center justify-center shrink-0">
                    <CategoryIcon name={cat.icon} className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{cat.name}</p>
                    <p className="text-sm text-muted">{cat.total_courses_count ?? 0} course</p>
                  </div>
                </div>
                {cat.description && <p className="text-sm text-muted">{cat.description}</p>}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => openEdit(cat)}>
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="dangerOutline"
                    size="sm"
                    onClick={() => setDeleteTarget(cat)}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>Hapus</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create / Edit Category Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Kategori' : 'Tambah Kategori Baru'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <InputField
            id="category-name"
            label="Nama Kategori"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            placeholder="Contoh: Teknologi & Pemrograman"
          />
          <SelectField
            id="category-icon"
            label="Ikon Kategori"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            error={fieldErrors.icon}
          >
            {ICON_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </SelectField>
          <TextareaField
            id="category-description"
            label="Deskripsi Singkat"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan topik pembelajaran dalam kategori ini..."
          />
          <div className="pt-2 flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Kategori'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kategori?"
        message={
          deleteTarget
            ? `Anda akan menghapus kategori "${deleteTarget.name}". Kategori yang masih digunakan oleh course akan ditolak oleh sistem.`
            : ''
        }
        confirmLabel="Ya, Hapus"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
