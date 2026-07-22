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
  Building2, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  X,
  AlertTriangle
} from 'lucide-react'
import { Atm } from '@/types'

export default function AtmPage() {
  const [atms, setAtms] = useState<Atm[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form/Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedAtmId, setSelectedAtmId] = useState<string | null>(null)
  
  const [kodeAtm, setKodeAtm] = useState('')
  const [kodeAtmLama, setKodeAtmLama] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [jenisMesin, setJenisMesin] = useState('')
  const [branch, setBranch] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Delete Confirmation states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [atmToDelete, setAtmToDelete] = useState<Atm | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch ATMs
  const fetchAtms = async (searchQuery = '') => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/atm${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setAtms(json.data || [])
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Gagal memuat data ATM.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAtms(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const openAddModal = () => {
    setModalMode('add')
    setSelectedAtmId(null)
    setKodeAtm('')
    setKodeAtmLama('')
    setLokasi('')
    setJenisMesin('')
    setBranch('')
    setIsModalOpen(true)
  }

  const openEditModal = (atm: Atm) => {
    setModalMode('edit')
    setSelectedAtmId(atm.id)
    setKodeAtm(atm.kodeAtm)
    setKodeAtmLama(atm.kodeAtmLama || '')
    setLokasi(atm.lokasi)
    setJenisMesin(atm.jenisMesin)
    setBranch(atm.branch)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const payload = {
      kodeAtm,
      kodeAtmLama: kodeAtmLama || null,
      lokasi,
      jenisMesin,
      branch
    }

    try {
      const url = modalMode === 'add' ? '/api/atm' : `/api/atm/${selectedAtmId}`
      const method = modalMode === 'add' ? 'POST' : 'PUT'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      
      if (json.error) throw new Error(json.error)
      
      setIsModalOpen(false)
      fetchAtms(search)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan data ATM.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (atm: Atm) => {
    setAtmToDelete(atm)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!atmToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/atm/${atmToDelete.id}`, {
        method: 'DELETE'
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      
      setIsDeleteOpen(false)
      setAtmToDelete(null)
      fetchAtms(search)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus ATM.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Data ATM
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola katalog fisik mesin ATM BNI di seluruh unit.
          </p>
        </div>
        <Button 
          onClick={openAddModal} 
          className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/10 active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah ATM
        </Button>
      </div>

      {/* Main card */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-600" />
              Katalog ATM
            </CardTitle>
            <CardDescription>Daftar mesin ATM yang aktif di sistem.</CardDescription>
          </div>
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari kode, lokasi, jenis..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute top-2.5 right-3 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="m-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex h-60 items-center justify-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <span className="ml-2 text-sm">Memuat data...</span>
            </div>
          ) : atms.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-slate-400">
              <Building2 className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium">Tidak ada data ATM ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/55 dark:bg-slate-900/30">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Kode ATM</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Kode Lama</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Lokasi</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Jenis Mesin</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Branch</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Penginput</TableHead>
                    <TableHead className="font-semibold text-right text-slate-600 dark:text-slate-400">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atms.map((atm) => (
                    <TableRow key={atm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                        {atm.kodeAtm}
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400">
                        {atm.kodeAtmLama ? (
                          <Badge variant="secondary" className="font-medium">{atm.kodeAtmLama}</Badge>
                        ) : (
                          <span className="text-xs italic text-slate-300">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                        {atm.lokasi}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{atm.jenisMesin}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{atm.branch}</TableCell>
                      <TableCell className="text-xs text-slate-400 font-medium">
                        {atm.user?.nama || 'System'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-teal-600"
                            onClick={() => openEditModal(atm)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                            onClick={() => confirmDelete(atm)}
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
            <DialogTitle>{modalMode === 'add' ? 'Tambah ATM Baru' : 'Edit Data ATM'}</DialogTitle>
            <DialogDescription>
              Isi data detail fisik mesin ATM di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kodeAtm">Kode ATM <span className="text-red-500">*</span></Label>
                <Input
                  id="kodeAtm"
                  value={kodeAtm}
                  onChange={(e) => setKodeAtm(e.target.value)}
                  placeholder="e.g. BNI0099"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kodeAtmLama">Kode ATM Lama</Label>
                <Input
                  id="kodeAtmLama"
                  value={kodeAtmLama}
                  onChange={(e) => setKodeAtmLama(e.target.value)}
                  placeholder="e.g. BNI0088"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lokasi">Lokasi Penempatan <span className="text-red-500">*</span></Label>
              <Input
                id="lokasi"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="e.g. Bandara Soekarno Hatta T3"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenisMesin">Jenis Mesin <span className="text-red-500">*</span></Label>
                <Input
                  id="jenisMesin"
                  value={jenisMesin}
                  onChange={(e) => setJenisMesin(e.target.value)}
                  placeholder="e.g. CRM / ATM"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Cabang Pengelola (Branch) <span className="text-red-500">*</span></Label>
                <Input
                  id="branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. KCU Harmoni"
                  required
                />
              </div>
            </div>

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
              <AlertTriangle className="h-5 w-5" /> Hapus Data ATM?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data ATM <strong>{atmToDelete?.kodeAtm}</strong>? Tindakan ini tidak dapat dibatalkan.
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
