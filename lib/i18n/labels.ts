import type { MessageKey } from '@/lib/i18n/messages'

// The readiness areas are built in English in the dashboard code. This maps
// each English name to its translated text.
export const AREA_KEY: Record<string, MessageKey> = {
  'Context & Leadership': 'area.context',
  Planning: 'area.planning',
  Support: 'area.support',
  Operation: 'area.operation',
  'Performance evaluation': 'area.evaluation',
  Improvement: 'area.improvement',
}
