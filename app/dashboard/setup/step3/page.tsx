'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StepShell, { FormField, inputCls } from '../_components/step-shell'

type Head = { department: string; name: string; email: string }
type Site = { name: string; city: string; scope: string }

const EMPTY_HEAD: Head = { department: '', name: '', email: '' }
const EMPTY_SITE: Site = { name: '', city: '', scope: '' }

export default function Step3Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [currentSetupStep, setCurrentSetupStep] = useState(0)
  const [form, setForm] = useState({
    director_name: '',
    director_email: '',
    qms_manager_name: '',
    qms_manager_email: '',
    consultant_name: '',
    target_date: '',
  })
  const [heads, setHeads] = useState<Head[]>([])
  const [sites, setSites] = useState<Site[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data: userRow } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle()
      if (!userRow?.company_id) {
        router.replace('/dashboard/setup/step1')
        return
      }
      const { data: c } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userRow.company_id)
        .maybeSingle()
      if (cancelled || !c) return
      setCompanyId(c.id)
      setCurrentSetupStep(c.setup_step ?? 0)
      setForm({
        director_name: c.director_name ?? '',
        director_email: c.director_email ?? '',
        qms_manager_name: c.qms_manager_name ?? '',
        qms_manager_email: c.qms_manager_email ?? '',
        consultant_name: c.consultant_name ?? '',
        target_date: c.target_date ?? '',
      })
      setHeads(Array.isArray(c.department_heads) ? c.department_heads : [])
      setSites(Array.isArray(c.sites) ? c.sites : [])
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [router])

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  async function save(advance: boolean) {
    if (!companyId) return
    setError(null)
    setSaving(true)
    const supabase = createClient()
    const targetStep = Math.max(currentSetupStep, 3)
    const payload = {
      director_name: form.director_name || null,
      director_email: form.director_email || null,
      qms_manager_name: form.qms_manager_name || null,
      qms_manager_email: form.qms_manager_email || null,
      consultant_name: form.consultant_name || null,
      target_date: form.target_date || null,
      department_heads: heads.filter((h) => h.name || h.email || h.department),
      sites: sites.filter((s) => s.name || s.city || s.scope),
      setup_step: advance ? targetStep : currentSetupStep,
    }
    const { error: e } = await supabase
      .from('companies')
      .update(payload)
      .eq('id', companyId)
    if (e) {
      setError(e.message)
      setSaving(false)
      return
    }
    if (advance) setCurrentSetupStep(targetStep)
    setSaving(false)
    if (advance) router.push('/dashboard/setup/step4')
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <StepShell
      step={3}
      title="Team & sites"
      description="Tell us who's involved and where you operate."
      saving={saving}
      onContinue={() => save(true)}
      onSaveDraft={() => save(false)}
    >
      {error && (
        <div
          role="alert"
          className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card title="Director">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name">
                <input
                  value={form.director_name}
                  onChange={(e) => update('director_name', e.target.value)}
                  className={inputCls}
                />
              </FormField>
              <FormField label="Email">
                <input
                  type="email"
                  value={form.director_email}
                  onChange={(e) => update('director_email', e.target.value)}
                  className={inputCls}
                />
              </FormField>
            </div>
          </Card>

          <Card title="QMS manager">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Name">
                <input
                  value={form.qms_manager_name}
                  onChange={(e) => update('qms_manager_name', e.target.value)}
                  className={inputCls}
                />
              </FormField>
              <FormField label="Email">
                <input
                  type="email"
                  value={form.qms_manager_email}
                  onChange={(e) => update('qms_manager_email', e.target.value)}
                  className={inputCls}
                />
              </FormField>
            </div>
          </Card>

          <Card
            title="Department heads"
            action={
              <button
                type="button"
                onClick={() => setHeads([...heads, { ...EMPTY_HEAD }])}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                + Add
              </button>
            }
          >
            {heads.length === 0 ? (
              <p className="text-xs text-gray-500">No department heads yet.</p>
            ) : (
              <div className="space-y-2">
                {heads.map((h, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      value={h.department}
                      placeholder="Department"
                      onChange={(e) =>
                        setHeads(
                          heads.map((x, idx) =>
                            idx === i ? { ...x, department: e.target.value } : x
                          )
                        )
                      }
                      className={`${inputCls} col-span-4`}
                    />
                    <input
                      value={h.name}
                      placeholder="Name"
                      onChange={(e) =>
                        setHeads(
                          heads.map((x, idx) =>
                            idx === i ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                      className={`${inputCls} col-span-4`}
                    />
                    <input
                      type="email"
                      value={h.email}
                      placeholder="Email"
                      onChange={(e) =>
                        setHeads(
                          heads.map((x, idx) =>
                            idx === i ? { ...x, email: e.target.value } : x
                          )
                        )
                      }
                      className={`${inputCls} col-span-3`}
                    />
                    <button
                      type="button"
                      onClick={() => setHeads(heads.filter((_, idx) => idx !== i))}
                      title="Remove"
                      className="col-span-1 text-gray-400 hover:text-red-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Sites"
            action={
              <button
                type="button"
                onClick={() => setSites([...sites, { ...EMPTY_SITE }])}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                + Add
              </button>
            }
          >
            {sites.length === 0 ? (
              <p className="text-xs text-gray-500">No sites yet.</p>
            ) : (
              <div className="space-y-2">
                {sites.map((s, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      value={s.name}
                      placeholder="Site name"
                      onChange={(e) =>
                        setSites(
                          sites.map((x, idx) =>
                            idx === i ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                      className={`${inputCls} col-span-4`}
                    />
                    <input
                      value={s.city}
                      placeholder="City"
                      onChange={(e) =>
                        setSites(
                          sites.map((x, idx) =>
                            idx === i ? { ...x, city: e.target.value } : x
                          )
                        )
                      }
                      className={`${inputCls} col-span-3`}
                    />
                    <input
                      value={s.scope}
                      placeholder="Scope"
                      onChange={(e) =>
                        setSites(
                          sites.map((x, idx) =>
                            idx === i ? { ...x, scope: e.target.value } : x
                          )
                        )
                      }
                      className={`${inputCls} col-span-4`}
                    />
                    <button
                      type="button"
                      onClick={() => setSites(sites.filter((_, idx) => idx !== i))}
                      title="Remove"
                      className="col-span-1 text-gray-400 hover:text-red-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Consultant & timeline">
            <FormField label="Consultant name (optional)">
              <input
                value={form.consultant_name}
                onChange={(e) => update('consultant_name', e.target.value)}
                className={inputCls}
                placeholder="e.g. John Smith, BSI Consulting"
              />
            </FormField>
            <FormField label="Target date for preparation">
              <input
                type="date"
                value={form.target_date}
                onChange={(e) => update('target_date', e.target.value)}
                className={inputCls}
              />
            </FormField>
          </Card>
        </div>
      </div>
    </StepShell>
  )
}

function Card({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
