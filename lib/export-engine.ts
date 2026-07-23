// Export engine (Engine 1) — turns a document's content into a real file.
//  - Word (.docx) for prose documents (policies, procedures, scope)
//  - Excel (.xlsx) for tables/registers (interested parties, risks, suppliers)
// Runs server-side in the export API route. Pure-JS libraries, no binaries.

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx'
import * as XLSX from 'xlsx'

export type ExportMeta = {
  title: string
  companyName?: string | null
  standard?: string // e.g. "ISO 9001:2015"
  clauses?: string // e.g. "5.2"
  status?: string // DRAFT / APPROVED
  documentCode?: string | null
}

const FOOTER_NOTE =
  'AI-assisted draft. Requires human review and approval before use in certification. Lemma IMS.'

/** Build a .docx from plain/markdown-ish text. Returns a Node Buffer. */
export async function buildDocx(content: string, meta: ExportMeta): Promise<Buffer> {
  const children: Paragraph[] = []

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: meta.title, bold: true })],
    })
  )

  // Control line
  const controlBits = [
    meta.companyName ? `Company: ${meta.companyName}` : null,
    meta.standard ? `Standard: ${meta.standard}` : null,
    meta.clauses ? `Clause(s): ${meta.clauses}` : null,
    meta.documentCode ? `Ref: ${meta.documentCode}` : null,
    meta.status ? `Status: ${meta.status}` : 'Status: DRAFT',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
  ].filter(Boolean)
  children.push(
    new Paragraph({
      children: [new TextRun({ text: controlBits.join('  ·  '), size: 18, color: '666666' })],
    })
  )
  children.push(new Paragraph({ text: '' }))

  // Body — split into paragraphs; lines starting with # become headings,
  // lines starting with - or • become bullet-ish paragraphs.
  for (const rawLine of content.split('\n')) {
    const line = rawLine.replace(/\r$/, '')
    if (line.trim() === '') {
      children.push(new Paragraph({ text: '' }))
      continue
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      children.push(
        new Paragraph({
          heading:
            level === 1 ? HeadingLevel.HEADING_2 : level === 2 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4,
          children: [new TextRun({ text: h[2], bold: true })],
        })
      )
      continue
    }
    const bullet = line.match(/^\s*[-•*]\s+(.*)$/)
    if (bullet) {
      children.push(new Paragraph({ text: bullet[1], bullet: { level: 0 } }))
      continue
    }
    children.push(new Paragraph({ children: [new TextRun({ text: line })] }))
  }

  // Footer note
  children.push(new Paragraph({ text: '' }))
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: FOOTER_NOTE, italics: true, size: 16, color: '999999' })],
    })
  )

  const doc = new Document({ sections: [{ children }] })
  return Packer.toBuffer(doc)
}

/**
 * Build a .xlsx. If the content looks like a table (pipe-separated or
 * tab-separated rows), it's parsed into cells; otherwise each line becomes a row.
 */
export function buildXlsx(content: string, meta: ExportMeta): Buffer {
  const lines = content.split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => l.trim() !== '')

  // Detect a separator
  const sep = lines.some((l) => l.includes('|')) ? '|' : lines.some((l) => l.includes('\t')) ? '\t' : null

  const rows: string[][] = []
  // Header block
  rows.push([meta.title])
  const controlBits = [
    meta.companyName ? `Company: ${meta.companyName}` : '',
    meta.standard ? `Standard: ${meta.standard}` : '',
    meta.clauses ? `Clause(s): ${meta.clauses}` : '',
    `Status: ${meta.status ?? 'DRAFT'}`,
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
  ].filter(Boolean)
  rows.push([controlBits.join('  ·  ')])
  rows.push([])

  if (sep) {
    for (const line of lines) {
      // skip markdown separator rows like |---|---|
      if (/^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('-')) continue
      const cells = line
        .split(sep)
        .map((c) => c.trim())
        .filter((_, i, arr) => !(sep === '|' && (i === 0 || i === arr.length - 1) && arr[i].trim() === ''))
      rows.push(cells)
    }
  } else {
    for (const line of lines) rows.push([line])
  }

  rows.push([])
  rows.push([FOOTER_NOTE])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Document')
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

export function safeFilename(title: string, code?: string | null, ext = 'docx'): string {
  const base = title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()
  return `${base}${code ? '-' + code.toLowerCase() : ''}.${ext}`
}
