// Sample "needs your attention" items for the public demo and for empty
// workspaces. Dates are relative to today so the demo never shows a date
// that has quietly slipped into the past.
//
// These are SAMPLE records for the fictional company in demo-data.ts.
// They run through the same buildAttention() logic as real company data.

import { buildAttention, type AttentionItem } from '@/lib/attention'
import { buildActivity, buildPulse, type ActivityItem, type PulseRow } from '@/lib/pulse'
import type { Locale } from '@/lib/i18n'

// Sample text for the fictional company, in each language.
const SAMPLE = {
  en: {
    sarah: 'Sarah Kim',
    john: 'John Park',
    complaint: 'Customer complaint: five parts arrived with damaged packaging',
    supplierRecord: 'Supplier evaluation record is missing for ABC Components',
    production: 'Production',
    abc: 'ABC Components',
    lateIssue: 'Late delivery of packaging material from ABC Components',
    label: 'Label mismatch on carton',
    late: 'Late delivery from a supplier',
    damaged: 'Damaged packaging on a shipment',
    drawing: 'Wrong part number on a drawing',
    capaPackaging: 'Packaging procedure updated',
    capaSupplier: 'Supplier re-evaluation',
  },
  ko: {
    sarah: '김서연',
    john: '박준호',
    complaint: '고객 불만: 포장이 파손된 부품 5개가 도착했습니다',
    supplierRecord: 'ABC부품 공급업체 평가 기록이 없습니다',
    production: '생산',
    abc: 'ABC부품',
    lateIssue: 'ABC부품 포장재 납품 지연',
    label: '박스 라벨 불일치',
    late: '공급업체 납품 지연',
    damaged: '출하품 포장 파손',
    drawing: '도면의 부품 번호 오류',
    capaPackaging: '포장 절차 개정',
    capaSupplier: '공급업체 재평가',
  },
} as const

function iso(today: Date, plusDays: number): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + plusDays)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function getDemoAttention(today: Date = new Date(), locale: Locale = 'en'): AttentionItem[] {
  const S = SAMPLE[locale]
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  return buildAttention({
    today,
    locale,
    userNames: { u1: S.sarah, u2: S.john },
    capas: [
      {
        id: 'c1',
        description: S.complaint,
        severity: 'high',
        status: 'in_progress',
        due_date: iso(today, 0),
        responsible_id: 'u1',
      },
      {
        id: 'c2',
        description: S.supplierRecord,
        severity: 'medium',
        status: 'open',
        due_date: iso(today, 3),
        responsible_id: 'u2',
      },
    ],
    audits: [
      { id: 'a1', title: null, department: S.production, scheduled_date: iso(today, 12), status: 'planned' },
    ],
    suppliers: [
      { id: 's1', name: S.abc, cert_expiry: iso(today, 9), approval_status: 'approved' },
    ],
    trainings: [
      {
        id: 't1',
        kind: 'plan',
        module: 'Operator skills',
        employee_name: null,
        scheduled_month: thisMonth,
        result: null,
        status: 'planned',
      },
    ],
    risks: [
      { id: 'r1', status: 'open', kind: 'risk', treatment: null, review_date: null },
      { id: 'r2', status: 'open', kind: 'risk', treatment: null, review_date: null },
    ],
    reminders: [],
    evidence: [],
    documents: [{ id: 'd1', status: 'in_review' }],
    issues: [
      {
        id: 'i1',
        issue_no: 12,
        title: S.lateIssue,
        status: 'new',
        owner_id: null,
        due_date: null,
        created_at: iso(today, -1),
      },
    ],
  })
}

function stamp(today: Date, minusDays: number): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - minusDays, 9, 0, 0)
  return d.toISOString()
}

// Sample records behind the demo's "Last 30 days" and "Recent activity".
function demoRows(today: Date, locale: Locale) {
  const S = SAMPLE[locale]
  return {
    issues: [
      { id: 'a', issue_no: 9, title: S.label, created_at: stamp(today, 20), closed_at: stamp(today, 15) },
      { id: 'b', issue_no: 10, title: S.late, created_at: stamp(today, 8), closed_at: stamp(today, 3) },
      { id: 'c', issue_no: 11, title: S.damaged, created_at: stamp(today, 1), closed_at: null },
      { id: 'd', issue_no: 8, title: S.drawing, created_at: stamp(today, 45), closed_at: stamp(today, 40) },
    ],
    capas: [
      { id: 'x', description: S.capaPackaging, created_at: stamp(today, 25), closed_at: stamp(today, 2) },
      { id: 'y', description: S.capaSupplier, created_at: stamp(today, 5), closed_at: null },
    ],
  }
}

export function getDemoPulse(today: Date = new Date(), locale: Locale = 'en'): PulseRow[] {
  const r = demoRows(today, locale)
  return buildPulse(today, r.issues, r.capas, locale)
}

export function getDemoActivity(today: Date = new Date(), locale: Locale = 'en'): ActivityItem[] {
  const r = demoRows(today, locale)
  return buildActivity(r.issues, r.capas, 5, locale)
}
