import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, BookOpen, Clock, Users } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryIcon } from '@/components/ui/CategoryIcon';

const THUMB_THEMES = {
  'teknologi-pemrograman': 'bg-primary-light text-primary-dark',
  'desain-ui-ux': 'bg-coral-light text-coral-ink',
  'bisnis-produktivitas': 'bg-accent-light text-ink',
  'literasi-digital': 'bg-secondary-light text-secondary',
  'bahasa-komunikasi': 'bg-purple-light text-purple',
};

export function CourseCard({ course }) {
  const thumbTheme =
    THUMB_THEMES[course.category_slug] || 'bg-primary-light text-primary-dark';

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col bg-white rounded-3xl border border-line overflow-hidden shadow-xs hover:shadow-md hover:border-primary/50 transition"
    >
      <div className={`aspect-video relative overflow-hidden ${thumbTheme}`}>
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={`Sampul course ${course.title}`}
            width={640}
            height={360}
            unoptimized
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            <div
              aria-hidden="true"
              className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/45"
            />
            <div
              aria-hidden="true"
              className="absolute -left-6 -top-6 w-20 h-20 rounded-full border-2 border-current/15"
            />
            <div className="relative w-14 h-14 rounded-2xl bg-white/95 text-ink flex items-center justify-center shadow-xs">
              <CategoryIcon name={course.category_icon || 'BookOpen'} className="w-7 h-7" />
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3 max-w-[58%]">
          <span className="inline-block truncate max-w-full bg-white text-ink text-xs font-semibold px-3 py-1 rounded-full shadow-xs border border-line">
            {course.category_name}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <StatusBadge status={course.level} className="bg-white shadow-xs" />
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-heading font-semibold text-lg text-ink line-clamp-2 group-hover:text-primary-hover transition">
          {course.title}
        </h3>

        <div className="mt-2.5 flex items-center gap-2 text-sm text-muted">
          <span className="w-6 h-6 rounded-full bg-primary-light text-primary-dark font-semibold text-xs flex items-center justify-center shrink-0">
            {course.teacher_name?.charAt(0)?.toUpperCase() || 'T'}
          </span>
          <span className="truncate">{course.teacher_name}</span>
          <BadgeCheck className="w-4 h-4 text-primary-hover shrink-0" aria-hidden="true" />
        </div>

        <div className="mt-auto pt-4 border-t border-line flex items-center justify-between gap-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary-hover" aria-hidden="true" />
            <span>{course.total_materials ?? 0} Materi</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            {course.total_duration > 0 ? (
              <>
                <Clock className="w-4 h-4 text-coral-text" aria-hidden="true" />
                <span>{course.total_duration} mnt</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4 text-coral-text" aria-hidden="true" />
                <span>{course.total_students ?? 0} Siswa</span>
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
