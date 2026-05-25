'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ISO_9001_CLAUSES } from '@/lib/iso-clauses'

type TabKey = 'programme' | 'plan' | 'checklists' | 'reports'
type FindingType = 'conformant' | 'nc' | 'observation'

type Audit = {
  id: string
  title: string | null
  department: string
  auditor_id: string | null
  auditor_name: string | null
  scheduled_date: string | null
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  report: string | null
  created_at: string
}

type Finding = {
  id: string
  audit_id: string
  clause_id: string | null
  description: string | null
  finding_type: FindingType
  capa_id: string | null
}

type UserRow = {
  id: string
  full_name: string | null
  email: string
  department: string | null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export default function AuditsPage() {
  const [tab, setTab] = useState<TabKey>('programme')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [audits, setAudits] = useState<Audit[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data: userRow } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle()
      if (!userRow?.company_id) {
        setLoading(false)
        return
      }
      const cid = userRow.company_id

      const [auditsRes, usersRes, companyRes] = await Promise.all([
        supabase
          .from('audits')
          .select('*')
          .eq('company_id', cid)
          .order('scheduled_date', { ascending: true, nullsFirst: false }),
        supabase
          .from('users')
          .select('id, full_name, email, department')
          .eq('company_id', cid),
        supabase
          .from('companies')
          .select('department_heads, processes')
          .eq('id', cid)
          .maybeSingle(),
      ])

      if (cancelled) return

      const deptSet = new Set<string>()
      ;((companyRes.data?.department_heads ?? []) as Array<{ department?: string }>).forEach(
        (h) => {
          if (h?.department) deptSet.add(h.department)
        }
      )
      ;(usersRes.data ?? []).forEach((u) => {
        if (u.department) deptSet.add(u.department)
      })
      ;(auditsRes.data ?? []).forEach((a) => {
        if (a.department) deptSet.add(a.department)
      })
      if (deptSet.size === 0) {
        ;['Production', 'Quality', 'Procurement', 'Sales', 'HR'].forEach((d) =>
          deptSet.add(d)
        )
      }

      setCompanyId(cid)
      setAudits((auditsRes.data ?? []) as Audit[])
      setUsers((usersRes.data ?? []) as UserRow[])
      setDepartments(Array.from(deptSet).sort())
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function createAudit(payload: {
    title: string
    department: string
    auditor_id: string | null
    auditor_name: string | null
    scheduled_date: string | null
  }) {
    if (!companyId) return
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('audits')
      .insert({
        ...payload,
        company_id: companyId,
        status: 'planned',
      })
      .select('*')
      .single()
    if (e) {
      setError(e.message)
      return
    }
    if (data) {
      setAudits((prev) =>
        [data as Audit, ...prev].sort((a, b) =>
          (a.scheduled_date ?? '').localeCompare(b.scheduled_date ?? '')
        )
      )
      setShowCreate(false)
    }
  }

  async function updateAudit(id: string, patch: Partial<Audit>) {
    if (!companyId) return
    const supabase = createClient()
    const { error: e } = await supabase.from('audits').update(patch).eq('id', id)
    if (e) {
      setError(e.message)
      return
    }
    setAudits((prev) =>
      prev.map((a) => (a.id === id ? ({ ...a, ...patch } as Audit) : a))
    )
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Audits</h1>
          <p className="text-sm text-gray-500 mt-1">
            Plan, run, and report on internal audits.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md whitespace-nowrap"
        >
          + Create audit
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-md p-1 w-fit overflow-x-auto">
        <Tab active={tab === 'programme'} onClick={() => setTab('programme')}>
          Annual programme
        </Tab>
        <Tab active={tab === 'plan'} onClick={() => setTab('plan')}>
          Audit plan
        </Tab>
        <Tab active={tab === 'checklists'} onClick={() => setTab('checklists')}>
          Checklists
        </Tab>
        <Tab active={tab === 'reports'} onClick={() => setTab('reports')}>
          Reports
        </Tab>
      </div>

      {tab === 'programme' && (
        <Programme audits={audits} departments={departments} />
      )}
      {tab === 'plan' && (
        <Plan audits={audits} onUpdate={updateAudit} />
      )}
      {tab === 'checklists' && companyId && (
        <Checklists audits={audits} companyId={companyId} onError={setError} />
      )}
      {tab === 'reports' && (
        <Reports audits={audits} onUpdate={updateAudit} />
      )}

      {showCreate && (
        <CreateAuditForm
          departments={departments}
          users={users}
          onClose={() => setShowCreate(false)}
          onSubmit={createAudit}
        />
      )}
    </div>
  )
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap ${
        active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

function Programme({
  audits,
  departments,
}: {
  audits: Audit[]
  departments: string[]
}) {
  const grid: Record<string, number[]> = {}
  departments.forEach((d) => {
    grid[d] = Array(12).fill(0)
  })
  audits.forEach((a) => {
    if (!a.scheduled_date) return
    const month = new Date(a.scheduled_date).getMonth()
    if (Number.isNaN(month)) return
    if (!grid[a.department]) grid[a.department] = Array(12).fill(0)
    grid[a.department][month]++
  })
  const deptList = Object.keys(grid).sort()
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-2.5 sticky left-0 bg-gray-50">Department</th>
            {MONTHS.map((m) => (
              <th key={m} className="px-2 py-2.5 text-center">
                {m}
              </th>
            ))}
            <th className="px-4 py-2.5 text-center">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {deptList.length === 0 ? (
            <tr>
              <td
                colSpan={MONTHS.length + 2}
                className="px-4 py-8 text-center text-sm text-gray-500"
              >
                No departments yet. Add team members or create audits to populate this view.
              </td>
            </tr>
          ) : (
            deptList.map((d) => {
              const total = grid[d].reduce((s, n) => s + n, 0)
              return (
                <tr key={d}>
                  <td className="px-4 py-3 text-gray-900 font-medium sticky left-0 bg-white">
                    {d}
                  </td>
                  {grid[d].map((count, i) => (
                    <td key={i} className="px-2 py-3 text-center">
                      {count > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
                          {count}
                        </span>
                      ) : (
                        <span className="text-gray-300">·</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center text-xs font-medium text-gray-700">
                    {total}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

function Plan({
  audits,
  onUpdate,
}: {
  audits: Audit[]
  onUpdate: (id: string, patch: Partial<Audit>) => void | Promise<void>
}) {
  if (audits.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-sm text-gray-500">No audits scheduled yet.</p>
        <p className="text-xs text-gray-400 mt-1">
          Click "Create audit" to schedule your first one.
        </p>
      </div>
    )
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-2.5">Title</th>
            <th className="px-4 py-2.5">Department</th>
            <th className="px-4 py-2.5">Auditor</th>
            <th className="px-4 py-2.5">Date</th>
            <th className="px-4 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {audits.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3 text-gray-900">
                {a.title ?? `${a.department} audit`}
              </td>
              <td className="px-4 py-3 text-gray-700">{a.department}</td>
              <td className="px-4 py-3 text-gray-700">{a.auditor_name ?? '—'}</td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {a.scheduled_date ?? '—'}
              </td>
              <td className="px-4 py-3">
                <select
                  value={a.status}
                  onChange={(e) =>
                    onUpdate(a.id, { status: e.target.value as Audit['status'] })
                  }
                  className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Checklists({
  audits,
  companyId,
  onError,
}: {
  audits: Audit[]
  companyId: string
  onError: (msg: string | null) => void
}) {
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(
    audits[0]?.id ?? null
  )
  const [findings, setFindings] = useState<Finding[]>([])
  const [loadingFindings, setLoadingFindings] = useState(false)

  useEffect(() => {
    if (!selectedAuditId) {
      setFindings([])
      return
    }
    let cancelled = false
    async function load() {
      setLoadingFindings(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('audit_findings')
        .select('*')
        .eq('audit_id', selectedAuditId)
      if (!cancelled) {
        setFindings((data ?? []) as Finding[])
        setLoadingFindings(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedAuditId])

  async function setFindingType(clauseId: string, type: FindingType) {
    if (!selectedAuditId) return
    onError(null)
    const supabase = createClient()
    const existing = findings.find((f) => f.clause_id === clauseId)
    let capa_id = existing?.capa_id ?? null

    if (type === 'nc' && !capa_id) {
      const { data: capa, error: capaErr } = await supabase
        .from('capas')
        .insert({
          company_id: companyId,
          description: `Internal audit finding — clause ${clauseId}`,
          severity: 'medium',
          status: 'open',
          current_step: 1,
        })
        .select('id')
        .single()
      if (capaErr) {
        onError(capaErr.message)
        return
      }
      capa_id = capa?.id ?? null
    } else if (type !== 'nc' && capa_id) {
      // Detach CAPA when downgrading from NC.
      capa_id = null
    }

    const { data, error: e } = await supabase
      .from('audit_findings')
      .upsert(
        {
          audit_id: selectedAuditId,
          company_id: companyId,
          clause_id: clauseId,
          finding_type: type,
          capa_id,
        },
        { onConflict: 'audit_id,clause_id' }
      )
      .select('*')
      .single()
    if (e) {
      onError(e.message)
      return
    }
    if (data) {
      setFindings((prev) => {
        const without = prev.filter((f) => f.clause_id !== clauseId)
        return [...without, data as Finding]
      })
    }
  }

  if (audits.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-sm text-gray-500">No audits to check yet.</p>
        <p className="text-xs text-gray-400 mt-1">
          Create an audit in the Audit plan tab first.
        </p>
      </div>
    )
  }

  const selected = audits.find((a) => a.id === selectedAuditId) ?? null
  const findingMap = new Map(findings.map((f) => [f.clause_id ?? '', f]))
  const counts = {
    conformant: findings.filter((f) => f.finding_type === 'conformant').length,
    nc: findings.filter((f) => f.finding_type === 'nc').length,
    observation: findings.filter((f) => f.finding_type === 'observation').length,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <label className="text-xs font-medium text-gray-700">Audit:</label>
        <select
          value={selectedAuditId ?? ''}
          onChange={(e) => setSelectedAuditId(e.target.value || null)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white"
        >
          {audits.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title ?? `${a.department} audit`} —{' '}
              {a.scheduled_date ?? 'unscheduled'}
            </option>
          ))}
        </select>
        {selected && (
          <span className="text-xs text-gray-500">
            {selected.department} · {selected.auditor_name ?? 'no auditor'}
          </span>
        )}
      </div>

      {selected && (
        <div className="flex gap-2">
          <Pill label="Conformant" value={counts.conformant} accent="emerald" />
          <Pill label="NC" value={counts.nc} accent="red" />
          <Pill label="Observation" value={counts.observation} accent="amber" />
        </div>
      )}

      {loadingFindings ? (
        <div className="text-sm text-gray-500">Loading checklist…</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Clause</th>
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Result</th>
                <th className="px-4 py-2.5">CAPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ISO_9001_CLAUSES.map((c) => {
                const f = findingMap.get(c.number)
                return (
                  <tr key={c.number}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {c.number}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{c.title}</td>
                    <td className="px-4 py-3">
                      <select
                        value={f?.finding_type ?? ''}
                        onChange={(e) =>
                          setFindingType(c.number, e.target.value as FindingType)
                        }
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="">—</option>
                        <option value="conformant">Conformant</option>
                        <option value="observation">Observation</option>
                        <option value="nc">NC</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {f?.capa_id ? (
                        <span className="text-blue-600">CAPA auto-created</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Pill({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: 'emerald' | 'red' | 'amber'
}) {
  const cls = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  }[accent]
  return (
    <span
      className={`text-xs font-semibold px-3 py-1 rounded-full border ${cls}`}
    >
      {label}: {value}
    </span>
  )
}

function Reports({
  audits,
  onUpdate,
}: {
  audits: Audit[]
  onUpdate: (id: string, patch: Partial<Audit>) => void | Promise<void>
}) {
  const completed = audits.filter((a) => a.status === 'completed')
  if (completed.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-sm text-gray-500">No completed audits yet.</p>
        <p className="text-xs text-gray-400 mt-1">
          Mark an audit as Completed in the Audit plan tab.
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {completed.map((a) => (
        <div key={a.id} className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {a.title ?? `${a.department} audit`}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {a.department} · {a.auditor_name ?? 'no auditor'} ·{' '}
                {a.scheduled_date ?? 'no date'}
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
              Completed
            </span>
          </div>
          <textarea
            value={a.report ?? ''}
            onChange={(e) => onUpdate(a.id, { report: e.target.value })}
            placeholder="Write the audit report here…"
            rows={4}
            className={`${inputCls} mt-3`}
          />
        </div>
      ))}
    </div>
  )
}

function CreateAuditForm({
  departments,
  users,
  onClose,
  onSubmit,
}: {
  departments: string[]
  users: UserRow[]
  onClose: () => void
  onSubmit: (p: {
    title: string
    department: string
    auditor_id: string | null
    auditor_name: string | null
    scheduled_date: string | null
  }) => void | Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState(departments[0] ?? '')
  const [auditorId, setAuditorId] = useState<string>('')
  const [date, setDate] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const auditor = useMemo(
    () => users.find((u) => u.id === auditorId) ?? null,
    [users, auditorId]
  )

  const sameDepartment =
    auditor?.department && department && auditor.department === department

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setValidationError(null)
    if (!department.trim()) {
      setValidationError('Department is required.')
      return
    }
    if (sameDepartment) {
      setValidationError(
        "An auditor cannot audit their own department. Pick someone from a different department."
      )
      return
    }
    setSubmitting(true)
    await onSubmit({
      title: title.trim() || `${department} audit`,
      department: department.trim(),
      auditor_id: auditor?.id ?? null,
      auditor_name: auditor ? auditor.full_name || auditor.email : null,
      scheduled_date: date || null,
    })
    setSubmitting(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-20 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create audit</h2>

        {validationError && (
          <div
            role="alert"
            className="mb-3 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700"
          >
            {validationError}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title (optional)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q2 internal audit — Production"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            {departments.length > 0 ? (
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputCls}
                required
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputCls}
                placeholder="Department being audited"
                required
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Auditor
            </label>
            <select
              value={auditorId}
              onChange={(e) => setAuditorId(e.target.value)}
              className={inputCls}
            >
              <option value="">No auditor assigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                  {u.department ? ` (${u.department})` : ''}
                </option>
              ))}
            </select>
            {sameDepartment && (
              <p className="text-[11px] text-red-600 mt-1">
                This auditor is in {auditor?.department} — they can't audit their own
                department.
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Scheduled date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-700 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !!sameDepartment}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              {submitting ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
