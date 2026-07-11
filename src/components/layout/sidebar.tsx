'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Monitor, 
  Building2, 
  FileSpreadsheet, 
  CalendarClock, 
  FileText, 
  Users, 
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  role?: 'admin' | 'user'
}

export default function Sidebar({ role = 'user' }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Data ATM', href: '/dashboard/atm', icon: Building2 },
    { name: 'Data PKS', href: '/dashboard/pks', icon: FileSpreadsheet },
    { name: 'Data Rental', href: '/dashboard/rental', icon: CalendarClock },
    { name: 'Monitoring Kontrak', href: '/dashboard/monitoring', icon: Monitor },
    { name: 'Laporan', href: '/dashboard/reports', icon: FileText },
  ]

  const adminItems = [
    { name: 'Manajemen User', href: '/dashboard/admin/users', icon: Users },
    { name: 'Activity Log', href: '/dashboard/admin/logs', icon: History },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside 
      className={cn(
        "relative flex flex-col border-r border-slate-200 bg-teal-950 text-slate-100 transition-all duration-350 ease-in-out dark:border-slate-800",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-teal-900">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 font-bold text-white shadow-md">
            B
          </div>
          {!collapsed && (
            <span className="font-bold tracking-wider text-lg text-white">
              BNI <span className="text-orange-400">ATM</span>
            </span>
          )}
        </Link>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-18 -right-3.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-7">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-2 text-xs font-semibold uppercase tracking-wider text-teal-400/70">
              Menu Utama
            </p>
          )}
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive(item.href)
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/10"
                  : "text-slate-300 hover:bg-teal-900/60 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive(item.href) ? "text-white" : "text-slate-400")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </div>

        {/* Admin Section */}
        {role === 'admin' && (
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-2 text-xs font-semibold uppercase tracking-wider text-orange-400/70">
                Administrator
              </p>
            )}
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive(item.href)
                    ? "bg-teal-800 text-white border-l-4 border-orange-500 shadow-inner"
                    : "text-slate-300 hover:bg-teal-900/60 hover:text-white"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive(item.href) ? "text-orange-400" : "text-slate-400")} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-4 border-t border-teal-900 bg-teal-950/40 text-center">
          <p className="text-xs text-slate-400/80">BNI ATM Rental System</p>
          <p className="text-[10px] text-slate-500">v1.0.0 &copy; 2026</p>
        </div>
      )}
    </aside>
  )
}
