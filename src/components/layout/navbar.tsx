'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { User as UserIcon, LogOut, ChevronDown, ShieldAlert } from 'lucide-react'

interface NavbarProps {
  user: {
    nama: string
    email: string
    role: 'admin' | 'user'
  }
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {/* Title Placeholder (Can be dynamic or state-driven) */}
      <div>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          ATM Rental Management
        </h1>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        {/* Role Badge */}
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
          user.role === 'admin' 
            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400' 
            : 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400'
        }`}>
          {user.role === 'admin' && <ShieldAlert className="h-3 w-3" />}
          {user.role}
        </span>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-3 py-1.5 h-auto">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white font-bold text-xs uppercase shadow-sm">
                  {user.nama.substring(0, 2)}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                    {user.nama}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {user.email}
                  </p>
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56 mt-1">
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs">
              <p className="font-semibold text-slate-700 dark:text-slate-300">{user.nama}</p>
              <p className="text-slate-400">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/20 dark:focus:text-red-400 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
