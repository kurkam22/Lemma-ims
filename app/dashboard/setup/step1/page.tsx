'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StepShell, { FormField, inputCls } from '../_components/step-shell'

const COUNTRIES = [
  'Uzbekistan', 'Kazakhstan', 'Russia', 'Tajikistan', 'Kyrgyzstan',
  'Turkmenistan', 'Azerbaijan', 'Georgia', 'Armenia', 'Belarus',
  'Ukraine', 'Moldova', 'Turkey', 'UAE', 'United Kingdom',
  'United States', 'Germany', 'France', 'Other',
]

const INDUSTRIES = [
  'Food manufacturing', 'Footwear production', 'Manufacturing',
  'Education', 'IT', 'Healthcare', 'Construction', 'Logistics',
]

const CERTS = ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018', 'ISO 22000:2018']
const LANGS = ['EN', 'RU', 'UZ']

const ACCEPT =
  '.pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

type UploadedFile = {
  id: string
  name: string
  size: number
  path?: string
  status: 'uploading' | 'done' | 'error'
  error?: string
}

function isAcceptedFile(name: string) {
  return /\.(pdf|docx|xlsx)$/i.test(name)
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function Step1Page() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [currentSetupStep, setCurrentSetupStep] = useState(0)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [form, setForm] = useState({
    name: '',
    country: '',
    industry: '',
    certification_goal: '',
    employee_count: '',
    interface_language: 'EN',
    document_language: 'EN',
  })

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
      if (userRow?.company_id) {
        const { data: c } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userRow.company_id)
          .maybeSingle()
        if (c && !cancelled) {
          setCompanyId(c.id)
          setCurrentSetupStep(c.setup_step ?? 0)
          setForm({
            name: c.name ?? '',
            country: c.country ?? '',
            industry: c.industry ?? '',
            certification_goal: c.certification_goal ?? '',
            employee_count: c.employee_count?.toString() ?? '',
            interface_language: c.interface_language ?? 'EN',
            document_language: c.document_language ?? 'EN',
          })
        }
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleFiles(fileList: FileList | File[]) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    for (const file of Array.from(fileList)) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      if (!isAcceptedFile(file.name)) {
        setFiles((prev) => [
          ...prev,
          { id, name: file.name, size: file.size, status: 'error', error: 'Unsupported format' },
        ])
        continue
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${user.id}/${id}-${safeName}`
      setFiles((prev) => [
        ...prev,
        { id, name: file.name, size: file.size, status: 'uploading' },
      ])
      const { error: upErr } = await supabase.storage
        .from('company-documents')
        .upload(path, file)
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? upErr
              ? { ...f, status: 'error', error: upErr.message }
              : { ...f, status: 'done', path }
            : f
        )
      )
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  async function save(advance: boolean) {
    setError(null)
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setError('Not signed in.')
      setSaving(false)
      return
    }
    const targetStep = Math.max(currentSetupStep, 1)
    const payload = {
      name: form.name.trim(),
      country: form.country || null,
      industry: form.industry || null,
      certification_goal: form.certification_goal || null,
      employee_count: form.employee_count ? parseInt(form.employee_count, 10) : null,
      interface_language: form.interface_language,
      document_language: form.document_language,
      setup_step: advance ? targetStep : currentSetupStep,
    }

    let cid = companyId
    if (!cid) {
      const { data, error: insErr } = await supabase
        .from('companies')
        .insert(payload)
        .select('id')
        .single()
      if (insErr || !data) {
        setError(insErr?.message ?? 'Could not create company.')
        setSaving(false)
        return
      }
      cid = data.id
      setCompanyId(cid)
      const { error: linkErr } = await supabase
        .from('users')
        .update({ company_id: cid })
        .eq('id', user.id)
      if (linkErr) {
        setError(linkErr.message)
        setSaving(false)
        return
      }
    } else {
      const { error: upErr } = await supabase
        .from('companies')
        .update(payload)
        .eq('id', cid)
      if (upErr) {
        setError(upErr.message)
        setSaving(false)
        return
      }
    }

    if (advance) setCurrentSetupStep(targetStep)
    setSaving(false)
    if (advance) router.push('/dashboard/setup/step2')
  }

  const canContinue =
    !!form.name.trim() &&
    !!form.country &&
    !!form.industry &&
    !!form.certification_goal

  if (loading) {
    return <div className="text-sm text-gray-500">Loading…</div>
  }

  return (
    <StepShell
      step={1}
      title="Basics + upload"
      description="Tell us about your company and upload existing policies, procedures, or other ISO-related documents."
      saving={saving}
      continueDisabled={!canContinue}
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
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <FormField label="Legal company name" required>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className={inputCls}
              placeholder="Acme Manufacturing LLC"
            />
          </FormField>

          <FormField label="Country" required>
            <select
              value={form.country}
              onChange={(e) => update('country', e.target.value)}
              className={inputCls}
            >
              <option value="">Select…</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Industry" required>
            <select
              value={form.industry}
              onChange={(e) => update('industry', e.target.value)}
              className={inputCls}
            >
              <option value="">Select…</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Certification goal" required>
            <select
              value={form.certification_goal}
              onChange={(e) => update('certification_goal', e.target.value)}
              className={inputCls}
            >
              <option value="">Select…</option>
              {CERTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Number of employees">
            <input
              type="number"
              min="1"
              value={form.employee_count}
              onChange={(e) => update('employee_count', e.target.value)}
              className={inputCls}
              placeholder="e.g. 120"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Interface language">
              <select
                value={form.interface_language}
                onChange={(e) => update('interface_language', e.target.value)}
                className={inputCls}
              >
                {LANGS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Document language">
              <select
                value={form.document_language}
                onChange={(e) => update('document_language', e.target.value)}
                className={inputCls}
              >
                {LANGS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Upload existing documents
          </h3>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <svg
              className="w-8 h-8 text-gray-400 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <p className="text-sm text-gray-700">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 font-medium hover:underline"
              >
                Click to upload
              </button>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">PDF, DOCX, XLSX</p>
          </div>

          <p className="text-xs text-gray-500 mt-3 italic">
            Temporary scan only — only confirmed files are saved to your workspace.
          </p>

          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-3 text-sm border border-gray-200 rounded-md px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-gray-900 truncate">{f.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatSize(f.size)}
                      {f.status === 'uploading' && ' · uploading…'}
                      {f.status === 'error' && ` · ${f.error}`}
                    </div>
                  </div>
                  {f.status === 'done' && (
                    <span className="text-xs text-emerald-600 font-medium">Uploaded</span>
                  )}
                  {f.status === 'error' && (
                    <span className="text-xs text-red-600 font-medium">Failed</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </StepShell>
  )
}
