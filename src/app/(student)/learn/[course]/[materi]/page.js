import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getLearningWorkspaceData } from '@/lib/queries/materials';
import { LearningWorkspaceClient } from '@/components/learning/LearningWorkspaceClient';
import { parsePositiveInt } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { course: courseSlug, materi } = await params;
  const user = await getCurrentUser();
  if (!user) return { title: 'Ruang Belajar' };
  const workspace = await getLearningWorkspaceData(courseSlug, parsePositiveInt(materi), user);
  if (workspace.status === 'OK' && workspace.activeMaterial) {
    return {
      title: `${workspace.activeMaterial.title} | ${workspace.course.title}`,
    };
  }
  return { title: 'Ruang Belajar' };
}

export default async function LearnMaterialPage({ params }) {
  const { course: courseSlug, materi } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?callbackUrl=/learn/${courseSlug}/${materi}`);
  }

  const materialId = parsePositiveInt(materi);
  if (!materialId) {
    notFound();
  }

  const workspace = await getLearningWorkspaceData(courseSlug, materialId, user);

  if (workspace.status === 'NOT_FOUND') {
    notFound();
  }
  if (workspace.status === 'NOT_ENROLLED') {
    redirect(`/courses/${courseSlug}`);
  }
  if (workspace.status === 'FORBIDDEN') {
    redirect('/403');
  }
  if (!workspace.activeMaterial) {
    notFound();
  }

  return (
    <LearningWorkspaceClient
      key={workspace.activeMaterial.id}
      course={workspace.course}
      initialMaterials={workspace.materials}
      activeMaterial={workspace.activeMaterial}
      initialProgress={workspace.progress}
      initialCertificateCode={workspace.enrollment?.certificate_code || null}
      isPreviewMode={workspace.isPreviewMode}
    />
  );
}
