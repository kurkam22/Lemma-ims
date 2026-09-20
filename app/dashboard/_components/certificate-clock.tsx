import { formatDate } from '@/lib/attention'
import { splitLabel, type ClockEvent, type ClockKind, type ClockModel } from '@/lib/certclock'

const CX = 320
const CY = 320
const RADII = [262, 206, 150]
const BAND = 40

const KIND_COLOR: Record<ClockKind, string> = {
  external: 'var(--lemma-ink)',
  internal: 'var(--lemma-primary)',
  review: 'var(--lemma-act)',
}

function xy(r: number, deg: number): [number, number] {
  const t = (deg * Math.PI) / 180
  return [CX + r * Math.sin(t), CY - r * Math.cos(t)]
}

/** A small shape for one kind of event. Filled = done, outline = coming. */
export function ClockMarker({ kind, done, x, y, size = 1 }: { kind: ClockKind; done: boolean; x: number; y: number; size?: number }) {
  const col = KIND_COLOR[kind]
  const fill = done ? col : 'var(--lemma-surface)'
  if (kind === 'external') return <circle cx={x} cy={y} r={10 * size} fill={fill} stroke={col} strokeWidth={3} />
  if (kind === 'internal')
    return <rect x={x - 8 * size} y={y - 8 * size} width={16 * size} height={16 * size} rx={2} fill={fill} stroke={col} strokeWidth={3} transform={`rotate(45 ${x} ${y})`} />
  return <rect x={x - 8 * size} y={y - 8 * size} width={16 * size} height={16 * size} rx={3} fill={fill} stroke={col} strokeWidth={3} />
}

export function LegendMarker({ kind, done = true }: { kind: ClockKind; done?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <ClockMarker kind={kind} done={done} x={11} y={11} size={0.7} />
    </svg>
  )
}

export default function CertificateClock({ model, today }: { model: ClockModel; today: Date }) {
  const placed = model.events.filter((e): e is ClockEvent & { ring: 0 | 1 | 2; angle: number } => e.ring !== null && e.angle !== null)
  const next = model.next
  const [line1, line2] = next ? splitLabel(next.label) : ['', '']
  const circ = (r: number) => 2 * Math.PI * r
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const todayLabel = formatDate(todayIso).toUpperCase()

  const summary = next
    ? `Next: ${next.label} on ${formatDate(next.date)}, in ${next.daysLeft} ${next.daysLeft === 1 ? 'day' : 'days'}.`
    : 'No upcoming audits or reviews are planned.'

  return (
    <svg viewBox="0 0 640 640" className="w-full h-auto" style={{ maxWidth: 640 }} role="img" aria-label={`Three rings, one for each year of the certificate. ${summary}`}>
      {RADII.map((r) => (
        <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="var(--lemma-line)" strokeWidth={BAND} />
      ))}

      {/* the part of the current year that has passed */}
      {model.todayRing !== null && model.todayAngle !== null && (
        <circle
          cx={CX}
          cy={CY}
          r={RADII[model.todayRing]}
          fill="none"
          stroke="var(--lemma-primary)"
          strokeOpacity={0.18}
          strokeWidth={BAND}
          strokeDasharray={`${(circ(RADII[model.todayRing]) * model.todayAngle) / 360} ${circ(RADII[model.todayRing])}`}
          transform={`rotate(-90 ${CX} ${CY})`}
        />
      )}

      {/* month ticks and names around the outer ring */}
      {model.ticks.map((a, i) => {
        const [x1, y1] = xy(RADII[0] + BAND / 2 + 2, a)
        const [x2, y2] = xy(RADII[0] + BAND / 2 + 9, a)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--lemma-mist)" strokeWidth={1.5} />
      })}
      {model.months.map((m) => {
        const [x, y] = xy(RADII[0] + BAND / 2 + 24, m.angle)
        return (
          <text key={m.label + m.angle} x={x} y={y + 4} textAnchor="middle" fontSize={12} fill="var(--lemma-slate)">
            {m.label}
          </text>
        )
      })}

      {/* the anniversary line and year labels */}
      {(() => {
        const [x1, y1] = xy(RADII[2] - BAND / 2, 0)
        const [x2, y2] = xy(RADII[0] + BAND / 2 + 12, 0)
        return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--lemma-ink)" strokeWidth={1.5} strokeDasharray="3 4" />
      })()}
      <text x={CX + 10} y={CY - RADII[0] - BAND / 2 - 14} fontSize={12} fontWeight={600} fill="var(--lemma-ink)">
        Certificate anniversary
      </text>
      {RADII.map((r, i) => (
        <text key={i} x={CX - 12} y={CY - r + 4} textAnchor="end" fontSize={11} fontWeight={600} letterSpacing={1.2} fill="var(--lemma-slate)">
          YEAR {i + 1}
        </text>
      ))}

      {/* the next event gets a halo, drawn first so markers sit on top */}
      {next && next.ring !== null && next.angle !== null && (() => {
        const [x, y] = xy(RADII[next.ring], next.angle)
        return <circle cx={x} cy={y} r={19} fill="var(--lemma-check-soft)" stroke="var(--lemma-check)" strokeWidth={2} />
      })()}
      {placed.map((e) => {
        const [x, y] = xy(RADII[e.ring], e.angle)
        return <ClockMarker key={e.id} kind={e.kind} done={e.done} x={x} y={y} />
      })}

      {/* today */}
      {model.todayAngle !== null && (() => {
        const [x1, y1] = xy(RADII[2] - BAND / 2 - 8, model.todayAngle)
        const [x2, y2] = xy(RADII[0] + BAND / 2 + 3, model.todayAngle)
        return (
          <g>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--lemma-ink)" strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={x2} cy={y2} r={4.5} fill="var(--lemma-ink)" />
          </g>
        )
      })()}

      {/* centre */}
      <text x={CX} y={CY - 52} textAnchor="middle" fontSize={12} fontWeight={600} letterSpacing={1.4} fill="var(--lemma-slate)">
        TODAY · {todayLabel}
      </text>
      {next ? (
        <>
          <text x={CX} y={CY - 22} textAnchor="middle" fontSize={13} fill="var(--lemma-slate)">Next</text>
          <text x={CX} y={CY + 6} textAnchor="middle" fontSize={line2 ? 24 : 26} fontWeight={700} fill="var(--lemma-ink)">{line1}</text>
          {line2 && <text x={CX} y={CY + 34} textAnchor="middle" fontSize={24} fontWeight={700} fill="var(--lemma-ink)">{line2}</text>}
          <text x={CX} y={CY + (line2 ? 60 : 32)} textAnchor="middle" fontSize={14} fill="var(--lemma-ink)">{formatDate(next.date)}</text>
          <text x={CX} y={CY + (line2 ? 80 : 52)} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--lemma-check)">
            {next.daysLeft === 0 ? 'today' : `in ${next.daysLeft} ${next.daysLeft === 1 ? 'day' : 'days'}`}
          </text>
        </>
      ) : (
        <>
          <text x={CX} y={CY + 4} textAnchor="middle" fontSize={20} fontWeight={700} fill="var(--lemma-ink)">Nothing planned</text>
          <text x={CX} y={CY + 30} textAnchor="middle" fontSize={13} fill="var(--lemma-slate)">Add your next audit</text>
        </>
      )}
    </svg>
  )
}
