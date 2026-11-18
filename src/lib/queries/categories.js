import { query } from '@/lib/db';
import { slugify } from '@/lib/validators';

export async function listCategoriesWithCounts() {
  const res = await query(
    `SELECT cat.id, cat.name, cat.slug, cat.description, cat.icon,
            COUNT(c.id) FILTER (WHERE c.status = 'published')::int AS published_courses_count,
            COUNT(c.id)::int AS total_courses_count
     FROM categories cat
     LEFT JOIN courses c ON c.category_id = cat.id
     GROUP BY cat.id
     ORDER BY cat.name ASC`
  );
  return res.rows;
}

async function generateUniqueCategorySlug(name, excludeId = null) {
  const baseSlug = slugify(name) || 'kategori';
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const res = await query(
      `SELECT id FROM categories WHERE slug = $1 AND ($2::bigint IS NULL OR id <> $2) LIMIT 1`,
      [candidate, excludeId]
    );
    if (res.rowCount === 0) return candidate;
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function createCategory({ name, description, icon }) {
  const slug = await generateUniqueCategorySlug(name);
  const res = await query(
    `INSERT INTO categories (name, slug, description, icon)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, slug, description, icon`,
    [name, slug, description, icon]
  );
  return res.rows[0];
}

export async function updateCategory(id, { name, description, icon }) {
  const slug = await generateUniqueCategorySlug(name, id);
  const res = await query(
    `UPDATE categories
     SET name = $1, slug = $2, description = $3, icon = $4
     WHERE id = $5
     RETURNING id, name, slug, description, icon`,
    [name, slug, description, icon, id]
  );
  return res.rows[0] || null;
}

export async function deleteCategory(id) {
  const res = await query(
    `DELETE FROM categories WHERE id = $1 RETURNING id, name`,
    [id]
  );
  return res.rows[0] || null;
}
