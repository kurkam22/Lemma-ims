import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from './_components/sidebar'
import TopBar from './_components/topbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userRow } = await supabase
    .from('users')
    .select('id, full_name, role, company_id')
    .eq('id', user.id)
    .maybeSingle()

  let companyName: string | null = null
  let openCapaCount = 0

  if (userRow?.company_id) {
    const [{ data: company }, { count }] = await Promise.all([
      supabase
        .from('companies')
        .select('name')
        .eq('id', userRow.company_id)
        .maybeSingle(),
      supabase
        .from('capas')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', userRow.company_id)
        .in('status', ['open', 'in_progress']),
    ])
    companyName = company?.name ?? null
    openCapaCount = count ?? 0
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--lemma-canvas)' }}>
      <Sidebar
        userName={userRow?.full_name || user.email || 'User'}
        userRole={userRow?.role ?? 'member'}
        openCapaCount={openCapaCount}
      />
      <div className="pl-0 lg:pl-48">
        <TopBar companyName={companyName} />
        <main className="p-4 lg:p-6 pt-16 lg:pt-6">{children}</main>
      </div>
    </div>
  )
}
