'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  AlertTriangle,
  Mail,
  User,
  Shield,
  ShieldCheck
} from 'lucide-react'
import { User as UserType } from '@/types'
import { formatTanggal } from '@/lib/utils'

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  
  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Delete states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/users')
      const json = await res.json()
      if (res.status === 403) throw new Error('Akses Ditolak. Halaman ini hanya untuk Administrator.')
      if (json.error) throw new Error(json.error)
      setUsers(json.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data user.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const openAddModal = () => {
    setModalMode('add')
    setSelectedUserId(null)
    setNama('')
    setEmail('')
    setRole('user')
    setPassword('')
    setIsModalOpen(true)
  }

  const openEditModal = (targetUser: UserType) => {
    setModalMode('edit')
    setSelectedUserId(targetUser.id)
    setNama(targetUser.nama)
    setEmail(targetUser.email)
    setRole(targetUser.role)
    setPassword('') // Kosongkan password saat edit
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const payload = {
      nama,
      email,
      role,
      ...(modalMode === 'add' ? { password } : {})
    }

    try {
      const url = modalMode === 'add' ? '/api/admin/users' : `/api/admin/users/${selectedUserId}`
      const method = modalMode === 'add' ? 'POST' : 'PUT'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      
      if (json.error) throw new Error(json.error)
      
      setIsModalOpen(false)
      fetchUsers()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan user.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (targetUser: UserType) => {
    setUserToDelete(targetUser)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE'
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      
      setIsDeleteOpen(false)
      setUserToDelete(null)
      fetchUsers()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus user.')
    } finally {
      setDeleting(false)
    }
  }

  if (error && error.includes('Akses Ditolak')) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center p-6">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Akses Ditolak</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Manajemen User
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola hak akses pengguna sistem (Administrator & Operator).
          </p>
        </div>
        <Button 
          onClick={openAddModal} 
          className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/10 active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah User
        </Button>
      </div>

      {/* Main card */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600" />
            Pengguna Sistem
          </CardTitle>
          <CardDescription>Akun pengguna terdaftar dalam basis data.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-60 items-center justify-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <span className="ml-2 text-sm">Memuat data...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-slate-400">
              <Users className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium">Tidak ada data user ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/55 dark:bg-slate-900/30">
                  <TableRow>
                    <TableHead className="font-semibold">Nama Pengguna</TableHead>
                    <TableHead className="font-semibold">Alamat Email</TableHead>
                    <TableHead className="font-semibold">Hak Akses (Role)</TableHead>
                    <TableHead className="font-semibold">Terdaftar Pada</TableHead>
                    <TableHead className="font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((targetUser) => (
                    <TableRow key={targetUser.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                        {targetUser.nama}
                      </TableCell>
                      <TableCell className="font-medium text-slate-600 dark:text-slate-400">
                        {targetUser.email}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`font-semibold border uppercase flex w-fit items-center gap-1 px-2.5 py-0.5 ${
                            targetUser.role === 'admin' 
                              ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30' 
                              : 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30'
                          }`}
                        >
                          {targetUser.role === 'admin' ? (
                            <ShieldCheck className="h-3 w-3" />
                          ) : (
                            <Shield className="h-3 w-3" />
                          )}
                          {targetUser.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatTanggal(targetUser.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-teal-600"
                            onClick={() => openEditModal(targetUser)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                            onClick={() => confirmDelete(targetUser)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{modalMode === 'add' ? 'Tambah User Baru' : 'Edit User'}</DialogTitle>
            <DialogDescription>
              Isi data detail identitas pengguna sistem di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap <span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <Input
                  id="nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Mail className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. johndoe@bni.co.id"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Hak Akses (Role) <span className="text-red-500">*</span></Label>
              <Select value={role} onValueChange={(val) => setRole(val || 'user')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User / Operator</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {modalMode === 'add' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password Sementara <span className="text-red-500">*</span></Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password minimal 6 karakter"
                  required
                />
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Hapus User?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus user <strong>{userToDelete?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
