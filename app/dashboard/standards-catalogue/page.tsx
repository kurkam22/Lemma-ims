'use client'

import { useState } from 'react'
import {
  STANDARDS_CATALOGUE,
  CATEGORY_LABELS,
  standardsByCategory,
  type StandardCategory,
} from '@/lib/standards-catalogue'

const CATEGORY_ORDER: StandardCategory[] = [
  'quality',
  'food',
  'environment',
  'safety',
  'information',
  'energy',
  'governance',
  'continuity',
  'sector',
]

export default function StandardsCataloguePage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<StandardCategory | 'all'>('all')

  const grouped = standardsByCategory()
  const q = query.trim().toLowerCase()

  function matches(text: string) {
    return !q || text.toLowerCase().includes(q)
  }

  const visibleCategories = CATEGORY_ORDER.filter(
    (c) => category === 'all' || category === c
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Standards catalogue</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {STANDARDS_CATALOGUE.length} management-system standards and schemes across{' '}
          {CATEGORY_ORDER.length} categories. Not sure which you need? Use the System
          selector.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search standards…"
          className="flex-1 min-w-[200px] border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as StandardCategory | 'all')}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="all">All categories</option>
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      {visibleCategories.map((cat) => {
        const items = (grouped[cat] ?? []).filter(
          (s) => matches(s.code) || matches(s.name) || matches(s.description)
        )
        if (items.length === 0) return null
        return (
          <section key={cat} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {CATEGORY_LABELS[cat]}
              {cat === 'food' && ' — food industry'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((s) => (
                <div
                  key={s.shortCode}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm text-gray-900">{s.code}</div>
                    {s.certifiable ? (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
                        Certifiable
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200 whitespace-nowrap">
                        Not yet
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 mt-0.5">{s.name}</div>
                  <p className="text-xs text-gray-600 mt-2">{s.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="font-medium text-gray-700">Who needs it: </span>
                    {s.whoNeedsIt}
                  </p>
                  {s.note && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2">
                      {s.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
