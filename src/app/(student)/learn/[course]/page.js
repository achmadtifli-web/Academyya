import { notFound, redirect } from 'next/navigation';
import { requirePageUser } from '@/lib/pageAuth';
import { getLearningWorkspaceData } from '@/lib/queries/materials';
import { AppFrame } from '@/components/layout/AppFrame';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default async function LearnCourseIndexPage({ params }) {
  const { course: courseSlug } = await params;
  const user = await requirePageUser({ callbackUrl: `/learn/${courseSlug}` });

  const workspace = await getLearningWorkspaceData(courseSlug, null, user);

  if (workspace.status === 'NOT_FOUND') {
    notFound();
  }
  if (workspace.status === 'NOT_ENROLLED') {
    redirect(`/courses/${courseSlug}`);
  }
  if (workspace.status === 'FORBIDDEN') {
    redirect('/403');
  }

  if (workspace.activeMaterial) {
    redirect(`/learn/${courseSlug}/${workspace.activeMaterial.id}`);
  }

  const canManage = user.role === 'admin' || user.role === 'teacher';
  const manageMaterialsHref =
    user.role === 'admin'
      ? `/admin/courses/${workspace.course.id}/materials`
      : `/teacher/courses/${workspace.course.id}/materials`;

  return (
    <AppFrame user={user}>
      <main className="flex-1 flex items-center justify-center p-6">
        <EmptyState
          title="Materi Belum Tersedia"
          description={
            canManage
              ? 'Course ini belum memiliki materi pembelajaran. Tambahkan materi terlebih dahulu sebelum dipublikasikan.'
              : 'Pengajar belum menambahkan materi pada course ini.'
          }
          actionLabel={canManage ? 'Kelola Materi Course' : 'Kembali ke Detail Course'}
          actionHref={canManage ? manageMaterialsHref : `/courses/${courseSlug}`}
        />
      </main>
    </AppFrame>
  );
}
