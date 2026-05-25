'use client'

import { useEffect, useState, Fragment } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const DEFAULT_PROCESSES = [
  'Sales',
  'Procurement',
  'Warehouse',
  'Cutting',
  'Stitching',
  'Assembly',
  'QC',
  'Delivery',
]

type ProcessTemplate = {
  owner: string
  participants: string
  purpose: string
  steps: string[]
  inputs: string[]
  outputs: string[]
  kpis: string[]
}

const TEMPLATES: Record<string, ProcessTemplate> = {
  Sales: {
    owner: 'Sales manager',
    participants: 'Sales team, Customer service',
    purpose: 'Identify customer needs, confirm orders, and feed them into production.',
    steps: [
      'Receive enquiry',
      'Verify requirements',
      'Issue quote',
      'Confirm order',
      'Hand off to production',
    ],
    inputs: ['Customer enquiry', 'Pricing list', 'Available capacity'],
    outputs: ['Confirmed order', 'Customer contract', 'Production handoff'],
    kpis: ['Order conversion rate', 'Quote turnaround time', 'Customer satisfaction'],
  },
  Procurement: {
    owner: 'Procurement manager',
    participants: 'Buyers, QC, Warehouse',
    purpose: 'Source and order materials that meet quality and delivery requirements.',
    steps: [
      'Receive material request',
      'Check approved supplier list',
      'Issue PO',
      'Track delivery',
      'Receive goods',
      'Inspect on arrival',
    ],
    inputs: ['Material requirements', 'Approved supplier list', 'Stock levels'],
    outputs: ['Issued POs', 'Received materials', 'Incoming inspection records'],
    kpis: ['On-time delivery rate', 'Supplier defect rate', 'PO cycle time'],
  },
  Warehouse: {
    owner: 'Warehouse manager',
    participants: 'Warehouse staff',
    purpose: 'Store materials and finished goods safely, traceably, and ready for use.',
    steps: [
      'Receive goods',
      'Verify against PO',
      'Store by lot/location',
      'Issue to production',
      'Periodic stocktake',
    ],
    inputs: ['Inspected goods', 'Storage plan', 'Production requests'],
    outputs: ['Stored inventory', 'Material issues to production', 'Stock records'],
    kpis: ['Stock accuracy', 'Damage/loss rate', 'Order fulfilment time'],
  },
  Cutting: {
    owner: 'Cutting line supervisor',
    participants: 'Cutters, QC',
    purpose: 'Convert raw material into cut parts according to pattern and quantity.',
    steps: [
      'Receive cutting plan',
      'Set up patterns',
      'Cut material',
      'In-process check',
      'Pass to next stage',
    ],
    inputs: ['Approved material', 'Pattern', 'Cutting plan'],
    outputs: ['Cut parts', 'Scrap records', 'Production logs'],
    kpis: ['Cutting efficiency', 'Material yield', 'Defect rate'],
  },
  Stitching: {
    owner: 'Stitching line supervisor',
    participants: 'Stitchers, Line leaders, QC',
    purpose: 'Assemble cut parts into semi-finished uppers or sub-assemblies.',
    steps: [
      'Receive cut parts',
      'Assign to operators',
      'Stitch per spec',
      'In-line QC',
      'Pass to assembly',
    ],
    inputs: ['Cut parts', 'Stitching specification', 'Threads and trims'],
    outputs: ['Stitched uppers', 'In-line QC records'],
    kpis: ['Output per hour', 'Rework rate', 'First-pass yield'],
  },
  Assembly: {
    owner: 'Assembly supervisor',
    participants: 'Assemblers, QC',
    purpose: 'Combine sub-assemblies and components into the finished product.',
    steps: [
      'Receive uppers and components',
      'Set up line',
      'Assemble per spec',
      'Check fit/finish',
      'Pass to QC',
    ],
    inputs: ['Stitched uppers', 'Components', 'Assembly instructions'],
    outputs: ['Finished pairs', 'Production logs'],
    kpis: ['Throughput', 'Defect rate at QC', 'Line balancing efficiency'],
  },
  QC: {
    owner: 'QC manager',
    participants: 'QC inspectors',
    purpose: 'Verify finished goods meet specifications before they reach the customer.',
    steps: [
      'Sample finished goods',
      'Inspect per checklist',
      'Record defects',
      'Release or hold',
      'Generate batch certificate',
    ],
    inputs: ['Finished goods', 'Inspection plan', 'Acceptance criteria'],
    outputs: ['Pass/fail decisions', 'Defect records', 'Batch release certificates'],
    kpis: ['Defect rate', 'Customer return rate', 'First-pass yield'],
  },
  Delivery: {
    owner: 'Logistics manager',
    participants: 'Logistics, Customer service',
    purpose: 'Pack and ship finished goods to customers on time and intact.',
    steps: [
      'Receive release from QC',
      'Pack per requirements',
      'Label and document',
      'Hand off to carrier',
      'Confirm delivery',
    ],
    inputs: ['Released goods', 'Customer shipping instructions', 'Packaging materials'],
    outputs: ['Packed shipments', 'Shipping documents', 'Delivery confirmations'],
    kpis: ['On-time delivery rate', 'Damage in transit', 'Documentation accuracy'],
  },
}

export default function ProcessesPage() {
  const [loading, setLoading] = useState(true)
  const [processes, setProcesses] = useState<string[]>(DEFAULT_PROCESSES)
  const [selected, setSelected] = useState<string | null>(null)

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
      const { data: c } = await supabase
        .from('companies')
        .select('processes')
        .eq('id', userRow.company_id)
        .maybeSingle()
      if (cancelled) return
      const stored = Array.isArray(c?.processes) ? (c.processes as string[]) : []
      if (stored.length > 0) setProcesses(stored)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const template = selected ? TEMPLATES[selected] : null

  if (loading) {
    return <div className="text-sm text-gray-500">Loading…</div>
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Process map</h1>
        <p className="text-sm text-gray-500 mt-1">
          Click a process to see its details and generate the procedure document.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-fit">
              {processes.map((p, i) => (
                <Fragment key={`${p}-${i}`}>
                  <button
                    type="button"
                    onClick={() => setSelected(p)}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 text-sm font-medium min-w-[110px] text-center transition ${
                      selected === p
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                  {i < processes.length - 1 && (
                    <svg
                      className="flex-shrink-0 w-5 h-5 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 12h14M13 5l7 7-7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Process flow loaded from your setup. Edit in{' '}
            <Link
              href="/dashboard/setup/step4"
              className="text-blue-600 hover:underline"
            >
              Processes & goals
            </Link>
            .
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 w-full">
          {!selected ? (
            <div className="text-sm text-gray-500 text-center py-12">
              Click a process to see its details.
            </div>
          ) : !template ? (
            <div>
              <h2 className="text-base font-semibold text-gray-900">{selected}</h2>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                No template defined for this process yet. Generate one to get started.
              </p>
              <Link
                href={`/dashboard/documents/generator?process=${encodeURIComponent(selected)}`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md"
              >
                Generate procedure
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="text-base font-semibold text-gray-900">{selected}</h2>
              <p className="text-xs text-gray-600 mt-2 mb-4 leading-relaxed">
                {template.purpose}
              </p>

              <div className="space-y-3">
                <CardField label="Owner" value={template.owner} />
                <CardField label="Participants" value={template.participants} />
                <CardList label="Steps" items={template.steps} ordered />
                <CardList label="Inputs" items={template.inputs} />
                <CardList label="Outputs" items={template.outputs} />
                <CardList label="KPIs" items={template.kpis} />
              </div>

              <Link
                href={`/dashboard/documents/generator?process=${encodeURIComponent(selected)}`}
                className="mt-5 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                </svg>
                Generate procedure
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CardField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-sm text-gray-900 mt-0.5">{value}</div>
    </div>
  )
}

function CardList({
  label,
  items,
  ordered,
}: {
  label: string
  items: string[]
  ordered?: boolean
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </div>
      {ordered ? (
        <ol className="text-xs text-gray-700 list-decimal pl-5 space-y-0.5">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="text-xs text-gray-700 list-disc pl-5 space-y-0.5">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
