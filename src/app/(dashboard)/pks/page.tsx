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
  FileSpreadsheet, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  X,
  AlertTriangle,
  Calendar
} from 'lucide-react'
import { Pks, Atm } from '@/types'
import { formatTanggal } from '@/lib/utils'

export default function PksPage() {
  const [pksList, setPksList] = useState<Pks[]>([])
  const [atms, setAtms] = useState<Atm[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedPksId, setSelectedPksId] = useState<string | null>(null)
  
  const [atmId, setAtmId] = useState('')
  const [nomorPks, setNomorPks] = useState('')
  const [tanggalPks, setTanggalPks] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Delete states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [pksToDelete, setPksToDelete] = useState<Pks | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch PKS
  const fetchPks = async (searchQuery = '') => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/pks${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setPksList(json.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data PKS.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch ATMs for selection dropdown
  const fetchAtms = async () => {
    try {
      const res = await fetch('/api/atm')
      const json = await res.json()
      setAtms(json.data || [])
    } catch (err) {
      console.error('Gagal mengambil daftar ATM untuk opsi:', err)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPks(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchAtms()
  }, [])

  const openAddModal = () => {
    setModalMode('add')
    setSelectedPksId(null)
    setAtmId('')
    setNomorPks('')
    setTanggalPks('')
    setIsModalOpen(true)
  }

  const openEditModal = (pks: Pks) => {
    setModalMode('edit')
    setSelectedPksId(pks.id)
    setAtmId(pks.atmId)
    setNomorPks(pks.nomorPks)
    
    // Format date string to YYYY-MM-DD for HTML input
    const dateObj = new Date(pks.tanggalPks)
    const formattedDate = dateObj.toISOString().split('T')[0]
    setTanggalPks(formattedDate)
    
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!atmId) {
      alert('Pilih mesin ATM terlebih dahulu.')
      return
    }
    
    setSaving(true)
    const payload = {
      atmId,
      nomorPks,
      tanggalPks
    }

    try {
      const url = modalMode === 'add' ? '/api/pks' : `/api/pks/${selectedPksId}`
      const method = modalMode === 'add' ? 'POST' : 'PUT'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      
      if (json.error) throw new Error(json.error)
      
      setIsModalOpen(false)
      fetchPks(search)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan data PKS.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (pks: Pks) => {
    setPksToDelete(pks)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!pksToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/pks/${pksToDelete.id}`, {
        method: 'DELETE'
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      
      setIsDeleteOpen(false)
      setPksToDelete(null)
      fetchPks(search)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus PKS.')
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
            Perjanjian Kerja Sama (PKS)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola dokumen PKS legal sewa tempat penempatan ATM.
          </p>
        </div>
        <Button 
          onClick={openAddModal} 
          className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/10 active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah PKS
        </Button>
      </div>

      {/* Main card */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-teal-600" />
              Daftar Dokumen PKS
            </CardTitle>
            <CardDescription>Dokumen PKS aktif berelasi dengan mesin ATM.</CardDescription>
          </div>
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nomor PKS, kode ATM..."
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
          ) : pksList.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-slate-400">
              <FileSpreadsheet className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium">Tidak ada data PKS ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/55 dark:bg-slate-900/30">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Nomor PKS</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Mesin ATM Terkait</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Lokasi ATM</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Tanggal Dokumen</TableHead>
                    <TableHead className="font-semibold text-right text-slate-600 dark:text-slate-400">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pksList.map((pks) => (
                    <TableRow key={pks.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                        {pks.nomorPks}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-teal-600 font-bold hover:bg-teal-700">
                          {pks.atm?.kodeAtm || 'Tidak Ditemukan'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                        {pks.atm?.lokasi || '-'}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {formatTanggal(pks.tanggalPks)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-teal-600"
                            onClick={() => openEditModal(pks)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                            onClick={() => confirmDelete(pks)}
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
            <DialogTitle>{modalMode === 'add' ? 'Tambah Dokumen PKS' : 'Edit Dokumen PKS'}</DialogTitle>
            <DialogDescription>
              Isi data detail perjanjian legal di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="atmId">Mesin ATM Terkait <span className="text-red-500">*</span></Label>
              <Select value={atmId} onValueChange={(val) => setAtmId(val || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih mesin ATM..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {atms.map((atm) => (
                    <SelectItem key={atm.id} value={atm.id}>
                      {atm.kodeAtm} - {atm.lokasi} ({atm.branch})
                    </SelectItem>
                  ))}
                  {atms.length === 0 && (
                    <SelectItem value="none" disabled>
                      Tidak ada ATM terdaftar. Silakan buat ATM terlebih dahulu.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomorPks">Nomor PKS <span className="text-red-500">*</span></Label>
              <Input
                id="nomorPks"
                value={nomorPks}
                onChange={(e) => setNomorPks(e.target.value)}
                placeholder="e.g. 123/PKS/BNI/2026"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggalPks">Tanggal Penandatanganan <span className="text-red-500">*</span></Label>
              <Input
                id="tanggalPks"
                type="date"
                value={tanggalPks}
                onChange={(e) => setTanggalPks(e.target.value)}
                required
              />
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
              <AlertTriangle className="h-5 w-5" /> Hapus Dokumen PKS?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus dokumen PKS <strong>{pksToDelete?.nomorPks}</strong>? Tindakan ini tidak dapat dibatalkan.
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
