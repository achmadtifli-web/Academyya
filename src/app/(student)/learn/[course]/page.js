import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getLearningWorkspaceData } from '@/lib/queries/materials';
import { AppFrame } from '@/components/layout/AppFrame';
import { EmptyState } from '@/components/ui/EmptyState';

export const dynamic = 'force-dynamic';

export default async function LearnCourseIndexPage({ params }) {
  const { course: courseSlug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?callbackUrl=/learn/${courseSlug}`);
  }

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

  return (
    <AppFrame user={user}>
      <main className="flex-1 flex items-center justify-center p-6">
        <EmptyState
          title="Materi Belum Tersedia"
          description="Course ini belum memiliki materi pembelajaran. Tambahkan materi dari Teacher Panel terlebih dahulu."
          actionLabel="Kembali ke Detail Course"
          actionHref={`/courses/${courseSlug}`}
        />
      </main>
    </AppFrame>
  );
}
