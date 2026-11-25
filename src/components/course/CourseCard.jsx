import Image from 'next/image';
import Link from 'next/link';
import { Award, BadgeCheck, BookOpen, Calendar, Clock, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { getCourseThumbnail } from '@/lib/courseThumbnails';
import { getCourseScheduleState } from '@/lib/validators';

const CATEGORY_TEXT_THEMES = {
  'teknologi-pemrograman': 'text-primary-dark',
  'desain-ui-ux': 'text-coral-ink',
  'bisnis-produktivitas': 'text-accent-dark',
  'literasi-digital': 'text-secondary',
  'bahasa-komunikasi': 'text-purple',
};

export function CourseCard({ course }) {
  const thumbnailSrc = getCourseThumbnail(course);
  const categoryTextTheme =
    CATEGORY_TEXT_THEMES[course.category_slug] || 'text-primary-dark';
  const schedule = getCourseScheduleState(course);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col bg-white rounded-3xl border border-line overflow-hidden shadow-xs hover:shadow-md hover:border-primary/50 transition min-w-0"
    >
      <div className="aspect-video relative overflow-hidden bg-page border-b border-line shrink-0">
        <Image
          src={thumbnailSrc}
          alt={`Sampul course ${course.title}`}
          width={640}
          height={360}
          unoptimized
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />
      </div>

      <div className="p-4 sm:p-5 xl:py-4 xl:px-3.5 flex-1 flex flex-col gap-3 min-w-0">
        {/* Category label & Level badge on a wrap-safe row */}
        <div className="flex flex-wrap items-center justify-between gap-x-1 gap-y-1.5 min-w-0">
          <span
            className={`text-xs font-semibold tracking-[-0.015em] leading-snug min-w-0 ${categoryTextTheme}`}
          >
            {course.category_name}
          </span>
          <StatusBadge status={course.level} className="shrink-0 !text-xs !px-2 !py-0.5 !gap-1" />
        </div>

        <h3 className="font-heading font-semibold text-base sm:text-lg text-ink leading-snug line-clamp-2 group-hover:text-primary-hover transition">
          {course.title}
        </h3>

        {(schedule.state !== 'open' || Boolean(course.finalized_at)) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {Boolean(course.finalized_at) && (
              <span className="inline-flex items-center gap-1 rounded-full border border-success/25 bg-success-light px-2.5 py-0.5 text-xs font-semibold text-success">
                <Award className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Bersertifikat</span>
              </span>
            )}
            {schedule.state !== 'open' && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  schedule.state === 'upcoming'
                    ? 'bg-accent-light text-ink border-accent-dark/30'
                    : 'bg-page text-muted border-line-strong'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {schedule.state === 'upcoming'
                    ? `Mulai ${schedule.startDateLabel}`
                    : `Berakhir ${schedule.endDateLabel}`}
                </span>
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-line space-y-2.5 min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted min-w-0">
            <Avatar src={course.teacher_avatar} name={course.teacher_name} size="xs" />
            <span className="truncate">{course.teacher_name}</span>
            <BadgeCheck className="w-4 h-4 text-primary-hover shrink-0" aria-hidden="true" />
          </div>

          <div className="flex items-center justify-between gap-3 text-sm font-medium text-muted">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <BookOpen className="w-4 h-4 text-primary-hover shrink-0" aria-hidden="true" />
              <span>{course.total_materials ?? 0} Materi</span>
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              {course.total_duration > 0 ? (
                <>
                  <Clock className="w-4 h-4 text-coral-text shrink-0" aria-hidden="true" />
                  <span>{course.total_duration} mnt</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 text-coral-text shrink-0" aria-hidden="true" />
                  <span>{course.total_students ?? 0} Siswa</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
