import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/services/auth-user'
import Sidebar from '@/components/layout/sidebar'
import Navbar from '@/components/layout/navbar'

export const dynamic = 'force-dynamic'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Ambil profile user yang aktif
  const user = await getCurrentUserProfile()

  // Jika tidak terotentikasi, alihkan ke halaman login
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Sidebar - navigasi kiri */}
      <Sidebar role={user.role} />

      {/* Konten utama di sebelah kanan */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar - bagian atas */}
        <Navbar user={user} />

        {/* Area konten dashboard */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
