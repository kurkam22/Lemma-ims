'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

type IconName =
  | 'home'
  | 'building'
  | 'layers'
  | 'file'
  | 'shield'
  | 'chart'
  | 'settings'
  | 'sparkle'

type NavItem = {
  label: string
  href: string
  icon?: IconName
  substeps?: { label: string; href: string }[]
  badgeCount?: number
}

type NavSection = {
  title?: string
  items: NavItem[]
}

function Icon({ name, className = 'w-3.5 h-3.5' }: { name: IconName; className?: string }) {
  const props = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    viewBox: '0 0 24 24',
  }
  switch (name) {
    case 'home':
      return (
        <svg {...props}>
          <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z" />
        </svg>
      )
    case 'building':
      return (
        <svg {...props}>
          <rect x="4" y="3" width="16" height="18" rx="1" />
          <path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" />
        </svg>
      )
    case 'layers':
      return (
        <svg {...props}>
          <path d="M12 3l9 5-9 5-9-5 9-5z" />
          <path d="M3 13l9 5 9-5" />
        </svg>
      )
    case 'file':
      return (
        <svg {...props}>
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" />
          <path d="M14 3v6h6" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...props}>
          <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...props}>
          <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg {...props}>
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
          <path d="M19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9L19 14z" />
        </svg>
      )
  }
}

export default function Sidebar({
  userName,
  userRole,
  openCapaCount,
}: {
  userName: string
  userRole: string
  openCapaCount: number
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const sections: NavSection[] = [
    {
      items: [{ label: 'Dashboard', href: '/dashboard', icon: 'home' }],
    },
    {
      title: 'START / SETUP',
      items: [
        {
          label: 'Company profile',
          href: '/dashboard/setup',
          icon: 'building',
          substeps: [
            { label: 'Upload documents', href: '/dashboard/setup/step1' },
            { label: 'AI findings', href: '/dashboard/setup/step2' },
            { label: 'Team & sites', href: '/dashboard/setup/step3' },
            { label: 'Processes & goals', href: '/dashboard/setup/step4' },
            { label: 'Implementation plan', href: '/dashboard/setup/step5' },
          ],
        },
      ],
    },
    {
      title: 'STANDARDS & REQUIREMENTS',
      items: [
        { label: 'Standards library', href: '/dashboard/standards', icon: 'layers' },
        { label: 'Clause requirements', href: '/dashboard/standards-catalogue', icon: 'layers' },
        { label: 'Process map', href: '/dashboard/processes', icon: 'layers' },
      ],
    },
    {
      title: 'DOCUMENTS',
      items: [
        { label: 'Required documents', href: '/dashboard/required-documents', icon: 'sparkle' },
        { label: 'AI document generator', href: '/dashboard/documents/generator', icon: 'file' },
        { label: 'Document centre', href: '/dashboard/documents/centre', icon: 'file' },
        { label: 'Export centre', href: '/dashboard/documents/export', icon: 'file' },
      ],
    },
    {
      title: 'IMPLEMENTATION',
      items: [
        { label: 'Evidence', href: '/dashboard/evidence', icon: 'shield' },
        { label: 'Training', href: '/dashboard/training', icon: 'shield' },
        { label: 'Suppliers', href: '/dashboard/suppliers', icon: 'shield' },
        { label: 'Risks & opportunities', href: '/dashboard/risk', icon: 'shield' },
      ],
    },
    {
      title: 'CHECK & AUDIT',
      items: [
        { label: 'AI compliance check', href: '/dashboard/compliance-check', icon: 'sparkle' },
        { label: 'Gap assessment', href: '/dashboard/gap-assessment', icon: 'shield' },
        { label: 'Internal audits', href: '/dashboard/audits', icon: 'shield' },
        { label: 'Management review', href: '/dashboard/management-review', icon: 'shield' },
        { label: 'Reports', href: '/dashboard/reports', icon: 'chart' },
      ],
    },
    {
      title: 'IMPROVE',
      items: [
        { label: 'CAPA', href: '/dashboard/capa', icon: 'shield', badgeCount: openCapaCount },
        { label: 'Improvement actions', href: '/dashboard/reports', icon: 'chart' },
        { label: 'Consultant review', href: '/dashboard/consultant-review', icon: 'chart' },
        { label: 'Choose auditor', href: '/dashboard/choose-auditor', icon: 'shield' },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [{ label: 'Settings', href: '/dashboard/settings', icon: 'settings' }],
    },
  ]

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--lemma-surface)', border: '1px solid var(--lemma-line)' }}
      >
        <span style={{ color: 'var(--lemma-ink)', fontSize: 18 }}>☰</span>
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(28,36,52,0.4)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-60 lg:w-48 flex flex-col z-50 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ background: 'var(--lemma-surface)', borderRight: '1px solid var(--lemma-line)' }}
      >
        <div className="px-4 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--lemma-line)' }}>
          <div>
            <h1 className="text-base font-bold tracking-tight" style={{ color: 'var(--lemma-ink)' }}>
              Lemma IMS
            </h1>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--lemma-mist)' }}>
              AI-assisted ISO compliance
            </p>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden"
            style={{ color: 'var(--lemma-mist)', fontSize: 20 }}
          >
            ×
          </button>
        </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 text-xs">
        {sections.map((section, idx) => (
          <div key={idx} className="mb-3">
            {section.title && (
              <div className="px-2 mb-1 text-[10px] font-semibold tracking-wider" style={{ color: 'var(--lemma-mist)' }}>
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const active = pathname === item.href
              return (
                <div key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md"
                    style={
                      active
                        ? { background: 'var(--lemma-primary-soft)', color: 'var(--lemma-primary)', fontWeight: 500 }
                        : { color: 'var(--lemma-slate)' }
                    }
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {item.icon && <Icon name={item.icon} />}
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--lemma-danger-soft)', color: 'var(--lemma-danger)' }}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </Link>
                  {item.substeps && (
                    <div className="ml-5 mt-0.5 mb-1 pl-2 space-y-0.5" style={{ borderLeft: '1px solid var(--lemma-line)' }}>
                      {item.substeps.map((s) => {
                        const sActive = pathname === s.href
                        return (
                          <Link
                            key={s.href}
                            href={s.href}
                            className="block px-2 py-1 rounded text-[11px]"
                            style={sActive ? { color: 'var(--lemma-primary)', fontWeight: 500 } : { color: 'var(--lemma-mist)' }}
                          >
                            {s.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--lemma-line)' }}>
        <button
          type="button"
          className="w-full text-left rounded-lg px-3 py-2.5 transition"
          style={{ background: 'var(--lemma-primary-soft)', border: '1px solid var(--lemma-primary)' }}
        >
          <div className="flex items-center gap-1.5" style={{ color: 'var(--lemma-primary)' }}>
            <Icon name="sparkle" />
            <span className="text-xs font-semibold">Ask Lemma AI</span>
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--lemma-slate)' }}>Get instant answers</p>
        </button>
      </div>

      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--lemma-line)' }}>
        <div className="text-xs font-medium truncate" style={{ color: 'var(--lemma-ink)' }}>{userName}</div>
        <div className="text-[10px] capitalize" style={{ color: 'var(--lemma-mist)' }}>{userRole}</div>
      </div>
    </aside>
    </>
  )
}
