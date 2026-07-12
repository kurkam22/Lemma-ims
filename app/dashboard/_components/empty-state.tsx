import Link from 'next/link'

/**
 * Guided empty state: tells a beginner what this page is, why it matters
 * for certification, and gives one clear way to start.
 */
export default function EmptyState({
  title,
  why,
  actionLabel,
  actionHref,
  hint,
}: {
  title: string
  why: string
  actionLabel?: string
  actionHref?: string
  hint?: string
}) {
  return (
    <div className="bg-white border border-dashed border-gray-300 rounded-lg p-10 text-center max-w-xl mx-auto">
      <div
        className="mx-auto w-10 h-10 rounded-full flex items-center justify-center text-lg"
        style={{ background: '#eff6ff', color: '#2563eb' }}
        aria-hidden
      >
        ✦
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mt-3">{title}</h3>
      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{why}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          {actionLabel}
        </Link>
      )}
      {hint && <p className="text-[11px] text-gray-400 mt-3">{hint}</p>}
    </div>
  )
}
