import {
  DEMO_AI_INSIGHTS,
  DEMO_CHAIN,
  DEMO_JOURNEY,
  type AiInsight,
  type ComplianceChainRow,
  type JourneyStage,
} from '@/lib/demo-data'
import type { Locale } from '@/lib/i18n'

// Korean versions of the sample-company blocks. English uses demo-data.ts.

const JOURNEY_KO: JourneyStage[] = [
  { key: 'plan', label: '계획', caption: '시스템 정의', pct: 90, tasks: ['회사 프로필', '적용 범위 및 프로세스', '리스크 및 목표'] },
  { key: 'do', label: '실행', caption: '구축 및 운영', pct: 71, tasks: ['문서 14건 준비됨', '증빙 수집', '직원 교육'] },
  { key: 'check', label: '점검', caption: '검증 및 측정', pct: 48, tasks: ['AI 적합성 점검', '내부심사 예정', '경영검토'] },
  { key: 'act', label: '조치', caption: '개선', pct: 25, tasks: ['진행 중인 시정조치 3건', '개선 조치'] },
]

const CHAIN_KO: ComplianceChainRow[] = [
  {
    clause: '7.2',
    requirement: '직원은 업무 수행에 필요한 역량을 갖추어야 하며, 이를 입증하는 기록을 보관해야 합니다.',
    answer: '작업자를 교육하고 숙련도 기록을 보관합니다.',
    answerOrigin: 'company',
    document: { label: '역량 관리 절차서', status: 'done', origin: 'company' },
    evidence: { label: '교육 기록', status: 'missing', origin: 'iso' },
    audit: { label: '아직 심사하지 않음', status: 'progress' },
    capa: { label: '교육 기록 업로드', status: 'missing' },
  },
  {
    clause: '8.4',
    requirement: '공급업체를 선정하고 재평가하는 기준을 정하고, 그 결과를 보관해야 합니다.',
    answer: '자체 규칙: 핵심 공급업체는 연 1회 재평가합니다 (불량 공급업체는 생산을 멈추게 하기 때문에 이렇게 정했습니다).',
    answerOrigin: 'company',
    document: { label: '공급업체 관리 절차서', status: 'done', origin: 'company' },
    evidence: { label: '평가 기록', status: 'missing', origin: 'iso' },
    audit: { label: '경미한 지적사항', status: 'progress' },
    capa: { label: '공급업체 평가 기록', status: 'progress' },
  },
  {
    clause: '9.2',
    requirement: '스스로 하는 심사의 주기를 계획하고 그 근거를 밝혀야 합니다. 가장 중요한 부분과 과거의 문제를 기준으로 정합니다.',
    answer: '계획: 생산 부문은 연 2회, 사무 부문은 연 1회 (생산이 가장 위험도가 높기 때문).',
    answerOrigin: 'company',
    document: { label: '심사 절차서', status: 'done', origin: 'company' },
    evidence: { label: '심사 보고서', status: 'progress', origin: 'iso' },
    audit: { label: '심사 계획 필요', status: 'missing' },
    capa: null,
  },
  {
    clause: '6.2',
    requirement: '품질 목표는 측정할 수 있어야 하고, 모니터링해야 하며, 책임자가 있어야 합니다.',
    answer: '품질을 개선하고 불만을 줄이는 것을 목표로 합니다.',
    answerOrigin: 'company',
    document: { label: '목표 관리 대장', status: 'progress', origin: 'iso' },
    evidence: { label: 'KPI 추적', status: 'missing', origin: 'iso' },
    audit: { label: '아직 심사하지 않음', status: 'progress' },
    capa: { label: '측정 가능한 KPI 추가', status: 'progress' },
  },
]

const INSIGHTS_KO: AiInsight[] = [
  { title: 'AI가 누락된 증빙 6건을 찾았습니다', detail: '여러 조항에 문서는 있지만 이를 뒷받침하는 증빙이 아직 없습니다.', severity: 'warning', stage: 'do' },
  { title: '품질 목표에 측정 가능한 KPI가 필요합니다', detail: '6.2항 — “품질 개선”은 측정할 수 없습니다. 목표 수치를 추가하세요.', severity: 'warning', stage: 'plan' },
  { title: '공급업체 평가 기록 누락', detail: '8.4항 — 절차는 있지만 보관된 평가 기록이 없습니다.', severity: 'warning', stage: 'do' },
  { title: '내부심사 계획 권장', detail: '9.2항 — 인증 전에 첫 내부심사 일정을 잡으세요.', severity: 'info', stage: 'check' },
  { title: '시정조치 기한 초과: 고객 불만 후속 조치', detail: '시정조치가 기한을 넘겼습니다. 검토 후 종료하세요.', severity: 'danger', stage: 'act' },
]

export const getDemoJourney = (locale: Locale): JourneyStage[] => (locale === 'ko' ? JOURNEY_KO : DEMO_JOURNEY)
export const getDemoChain = (locale: Locale): ComplianceChainRow[] => (locale === 'ko' ? CHAIN_KO : DEMO_CHAIN)
export const getDemoInsights = (locale: Locale): AiInsight[] => (locale === 'ko' ? INSIGHTS_KO : DEMO_AI_INSIGHTS)
export const getDemoCompanyName = (locale: Locale): string => (locale === 'ko' ? 'ABC제조(주)' : 'ABC Manufacturing Ltd.')
