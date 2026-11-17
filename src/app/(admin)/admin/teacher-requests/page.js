import { listTeacherApplicationsForAdmin } from '@/lib/queries/users';
import { TeacherRequestsClient } from '@/components/admin/TeacherRequestsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Verifikasi Teacher',
};

export default async function AdminTeacherRequestsPage() {
  const requests = await listTeacherApplicationsForAdmin('all');

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-bold text-ink">
          Verifikasi Pengajuan Teacher
        </h1>
        <p className="text-base text-muted">
          Tinjau keahlian, motivasi, dan portofolio pelamar sebelum mengaktifkan hak akses pengajar.
        </p>
      </div>

      <TeacherRequestsClient initialRequests={requests} />
    </div>
  );
}
