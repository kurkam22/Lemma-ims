'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import StepShell, { inputCls } from '../_components/step-shell'

const FOOTWEAR_PROCESSES = [
  'Sales',
  'Procurement',
  'Warehouse',
  'Cutting',
  'Stitching',
  'Assembly',
  'QC',
  'Delivery',
]

type Objective = { description: string; target_value: string; deadline: string }
const EMPTY_OBJECTIVE: Objective = { description: '', target_value: '', deadline: '' }

export default function Step4Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [currentSetupStep, setCurrentSetupStep] = useState(0)
  const [processes, setProcesses] = useState<string[]>([])
  const [newProcess, setNewProcess] = useState('')
  const [objectives, setObjectives] = useState<Objective[]>([])

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
      const existing = Array.isArray(c.processes) ? (c.processes as string[]) : []
      if (existing.length === 0 && c.industry === 'Footwear production') {
        setProcesses(FOOTWEAR_PROCESSES)
      } else {
        setProcesses(existing)
      }
      setObjectives(
        Array.isArray(c.quality_objectives) ? (c.quality_objectives as Objective[]) : []
      )
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [router])

  function addProcess() {
    const v = newProcess.trim()
    if (!v) return
    setProcesses([...processes, v])
    setNewProcess('')
  }

  function removeProcess(i: number) {
    setProcesses(processes.filter((_, idx) => idx !== i))
  }

  function moveProcess(i: number, dir: -1 | 1) {
    const target = i + dir
    if (target < 0 || target >= processes.length) return
    const next = [...processes]
    ;[next[i], next[target]] = [next[target], next[i]]
    setProcesses(next)
  }

  async function save(advance: boolean) {
    if (!companyId) return
    setError(null)
    setSaving(true)
    const supabase = createClient()
    const targetStep = Math.max(currentSetupStep, 4)
    const { error: e } = await supabase
      .from('companies')
      .update({
        processes,
        quality_objectives: objectives.filter(
          (o) => o.description || o.target_value || o.deadline
        ),
        setup_step: advance ? targetStep : currentSetupStep,
      })
      .eq('id', companyId)
    if (e) {
      setError(e.message)
      setSaving(false)
      return
    }
    if (advance) setCurrentSetupStep(targetStep)
    setSaving(false)
    if (advance) router.push('/dashboard/setup/step5')
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <StepShell
      step={4}
      title="Processes & goals"
      description="Map your core process flow and set quality objectives."
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
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Process flow</h3>
          <p className="text-xs text-gray-500 mb-4">
            List your core processes in order. Use ↑/↓ to reorder.
          </p>

          {processes.length === 0 ? (
            <p className="text-xs text-gray-400 italic mb-3">
              No processes yet. Add your first below.
            </p>
          ) : (
            <ol className="space-y-2 mb-3">
              {processes.map((p, i) => (
                <li
                  key={`${p}-${i}`}
                  className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2"
                >
                  <span className="text-xs font-semibold text-gray-400 w-5 text-right">
                    {i + 1}.
                  </span>
                  <span className="flex-1 text-sm text-gray-900">{p}</span>
                  <button
                    type="button"
                    onClick={() => moveProcess(i, -1)}
                    disabled={i === 0}
                    title="Move up"
                    className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProcess(i, 1)}
                    disabled={i === processes.length - 1}
                    title="Move down"
                    className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProcess(i)}
                    title="Remove"
                    className="p-1 rounded text-gray-400 hover:text-red-600 text-lg leading-none"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ol>
          )}

          <div className="flex gap-2">
            <input
              value={newProcess}
              onChange={(e) => setNewProcess(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addProcess()
                }
              }}
              placeholder="e.g. Procurement"
              className={inputCls}
            />
            <button
              type="button"
              onClick={addProcess}
              disabled={!newProcess.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium px-4 py-2 rounded-md whitespace-nowrap"
            >
              Add
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Quality objectives</h3>
            <button
              type="button"
              onClick={() => setObjectives([...objectives, { ...EMPTY_OBJECTIVE }])}
              className="text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              + Add
            </button>
          </div>

          {objectives.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No objectives yet.</p>
          ) : (
            <div className="space-y-3">
              {objectives.map((o, i) => (
                <div key={i} className="border border-gray-200 rounded-md p-3 space-y-2">
                  <input
                    value={o.description}
                    placeholder="Objective description"
                    onChange={(e) =>
                      setObjectives(
                        objectives.map((x, idx) =>
                          idx === i ? { ...x, description: e.target.value } : x
                        )
                      )
                    }
                    className={inputCls}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={o.target_value}
                      placeholder="Target value (e.g. 95%)"
                      onChange={(e) =>
                        setObjectives(
                          objectives.map((x, idx) =>
                            idx === i ? { ...x, target_value: e.target.value } : x
                          )
                        )
                      }
                      className={inputCls}
                    />
                    <input
                      type="date"
                      value={o.deadline}
                      onChange={(e) =>
                        setObjectives(
                          objectives.map((x, idx) =>
                            idx === i ? { ...x, deadline: e.target.value } : x
                          )
                        )
                      }
                      className={inputCls}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setObjectives(objectives.filter((_, idx) => idx !== i))
                      }
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StepShell>
  )
}
