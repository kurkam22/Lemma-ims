import Link from 'next/link'

const FEATURES = [
  {
    title: 'AI compliance check',
    body: 'Paste any policy or procedure and get a clause-by-clause verdict — covered, partial, or missing — with evidence quoted from your own text.',
  },
  {
    title: 'Document generator',
    body: 'Generate audit-ready policies, procedures, risk registers, and matrices from your confirmed company data. No invented facts — gaps are flagged, not filled.',
  },
  {
    title: 'Gap assessment',
    body: 'A live clause-by-clause view of where you stand: documents, evidence, and risk per requirement.',
  },
  {
    title: 'CAPA workflow',
    body: 'A 7-step corrective action workflow from initiation through root cause to verified closure.',
  },
  {
    title: 'Audit & management review',
    body: 'Plan internal audits, track findings, and generate management review agendas from your real QMS data.',
  },
  {
    title: 'Evidence & suppliers',
    body: 'Upload evidence with AI classification to clauses, and keep supplier evaluations and training records in one place.',
  },
]

const STANDARDS = ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 45001:2018', 'ISO 22000']

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="font-semibold">Lemma IMS</div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-1.5">
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-md"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          ISO certification, without the consultant invoice
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Lemma IMS is an AI-assisted integrated management system. Build your documentation,
          find your gaps, and walk into the certification audit prepared.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-md"
          >
            Start free
          </Link>
          <Link
            href="/login"
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-md"
          >
            Sign in
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {STANDARDS.map((s) => (
            <span
              key={s}
              className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold">{f.title}</h2>
            <p className="mt-1.5 text-sm text-gray-600">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
          <h2 className="text-xl font-semibold">Built for small teams chasing their first certificate</h2>
          <p className="mt-2 text-sm text-gray-600 max-w-xl mx-auto">
            Your data stays in your workspace, scoped per company. AI drafts are grounded in your
            confirmed inputs — anything unknown is marked [TO CONFIRM], never invented.
          </p>
          <Link
            href="/register"
            className="inline-block mt-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-md"
          >
            Create your workspace
          </Link>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 py-8 text-xs text-gray-400 border-t border-gray-100">
        © {new Date().getFullYear()} Lemma IMS. AI output requires human review before use in certification.
      </footer>
    </main>
  )
}
