'use client'

import Link from 'next/link'
import { Fragment } from 'react'

const STEPS = [
  { num: 1, label: 'Basics + upload', href: '/dashboard/setup/step1' },
  { num: 2, label: 'Review AI findings', href: '/dashboard/setup/step2' },
  { num: 3, label: 'Team & sites', href: '/dashboard/setup/step3' },
  { num: 4, label: 'Processes & goals', href: '/dashboard/setup/step4' },
  { num: 5, label: 'Next steps', href: '/dashboard/setup/step5' },
] as const

export const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export function FormField({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

export function ProgressIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = s.num < current
        const active = s.num === current
        return (
          <Fragment key={s.num}>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {done ? '✓' : s.num}
              </div>
              <span
                className={`text-xs font-medium hidden md:inline ${
                  active ? 'text-gray-900' : done ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

export default function StepShell({
  step,
  title,
  description,
  saving,
  continueDisabled,
  onContinue,
  onSaveDraft,
  continueLabel = 'Continue',
  children,
}: {
  step: 1 | 2 | 3 | 4 | 5
  title: string
  description?: string
  saving?: boolean
  continueDisabled?: boolean
  onContinue: () => void | Promise<void>
  onSaveDraft?: () => void | Promise<void>
  continueLabel?: string
  children: React.ReactNode
}) {
  const prev = step > 1 ? STEPS[step - 2].href : null

  return (
    <div className="pb-24">
      <ProgressIndicator current={step} />

      <div className="mt-6">
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>

      <div className="mt-6">{children}</div>

      <div className="fixed bottom-0 left-48 right-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between z-10">
        {prev ? (
          <Link
            href={prev}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5"
          >
            ← Back
          </Link>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-3">
          {onSaveDraft && (
            <button
              type="button"
              onClick={() => onSaveDraft()}
              disabled={saving}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 disabled:opacity-50"
            >
              Save draft
            </button>
          )}
          <button
            type="button"
            onClick={() => onContinue()}
            disabled={saving || continueDisabled}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-1.5 rounded-md"
          >
            {saving ? 'Saving…' : continueLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
