'use client'

import { useState } from 'react'

type Lang = 'EN' | 'RU' | 'UZ'

export default function TopBar({ companyName }: { companyName: string | null }) {
  const [lang, setLang] = useState<Lang>('EN')

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 gap-4">
      <div className="flex-1 max-w-md relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          placeholder="Search documents, clauses, evidence…"
          className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {companyName && (
          <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md whitespace-nowrap">
            {companyName}
          </span>
        )}

        <button
          type="button"
          title="Notifications"
          aria-label="Notifications"
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </button>

        <button
          type="button"
          title="Help"
          aria-label="Help"
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </button>

        <div className="flex bg-gray-100 rounded-md p-0.5">
          {(['EN', 'RU', 'UZ'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded transition ${
                lang === l
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
