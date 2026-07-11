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
  CalendarClock, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  X,
  AlertTriangle,
  Calendar,
  Coins
} from 'lucide-react'
import { Sewa, Pks } from '@/types'
import { formatTanggal, formatRupiah, STATUS_KONTRAK_LABEL, STATUS_KONTRAK_COLOR } from '@/lib/utils'

export default function RentalPage() {
  const [rentals, setRentals] = useState<Sewa[]>([])
  const [pksList, setPksList] = useState<Pks[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null)
  
  const [pksId, setPksId] = useState('')
  const [nilaiSewa, setNilaiSewa] = useState('')
  const [tglMulai, setTglMulai] = useState('')
  const [tglBerakhir, setTglBerakhir] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [status, setStatus] = useState('aktif')
  const [saving, setSaving] = useState(false)
  
  // Delete states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [rentalToDelete, setRentalToDelete] = useState<Sewa | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch rentals
  const fetchRentals = async (searchQuery = '') => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/rental${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setRentals(json.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data sewa.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch PKS lists for select option
  const fetchPksList = async () => {
    try {
      const res = await fetch('/api/pks')
      const json = await res.json()
      setPksList(json.data || [])
    } catch (err) {
      console.error('Gagal memuat opsi PKS:', err)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRentals(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchPksList()
  }, [])

  const openAddModal = () => {
    setModalMode('add')
    setSelectedRentalId(null)
    setPksId('')
    setNilaiSewa('')
    setTglMulai('')
    setTglBerakhir('')
    setKeterangan('')
    setStatus('aktif')
    setIsModalOpen(true)
  }

  const openEditModal = (rental: Sewa) => {
    setModalMode('edit')
    setSelectedRentalId(rental.id)
    setPksId(rental.pksId)
    setNilaiSewa(String(rental.nilaiSewa))
    setKeterangan(rental.keterangan || '')
    setStatus(rental.status || 'aktif')
    
    // Format dates for html input
    const startObj = new Date(rental.tglMulai)
    const endObj = new Date(rental.tglBerakhir)
    setTglMulai(startObj.toISOString().split('T')[0])
    setTglBerakhir(endObj.toISOString().split('T')[0])
    
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pksId) {
      alert('Pilih dokumen PKS terlebih dahulu.')
      return
    }

    setSaving(true)
    const payload = {
      pksId,
      nilaiSewa: Number(nilaiSewa),
      tglMulai,
      tglBerakhir,
      keterangan,
      status
    }

    try {
      const url = modalMode === 'add' ? '/api/rental' : `/api/rental/${selectedRentalId}`
      const method = modalMode === 'add' ? 'POST' : 'PUT'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      
      if (json.error) throw new Error(json.error)
      
      setIsModalOpen(false)
      fetchRentals(search)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan data sewa.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (rental: Sewa) => {
    setRentalToDelete(rental)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!rentalToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/rental/${rentalToDelete.id}`, {
        method: 'DELETE'
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      
      setIsDeleteOpen(false)
      setRentalToDelete(null)
      fetchRentals(search)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus data sewa.')
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
            Data Sewa (Rental)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola transaksi nilai sewa, periode sewa, dan integrasi dengan dokumen PKS ATM.
          </p>
        </div>
        <Button 
          onClick={openAddModal} 
          className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/10 active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Sewa
        </Button>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-teal-600" />
              Kontrak Sewa
            </CardTitle>
            <CardDescription>Integrasi nilai transaksi sewa dan durasi kontrak.</CardDescription>
          </div>
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari PKS, kode ATM, keterangan..."
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
          ) : rentals.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-slate-400">
              <CalendarClock className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium">Tidak ada kontrak sewa ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/55 dark:bg-slate-900/30">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Nomor PKS</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Kode & Lokasi ATM</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Nilai Sewa</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Periode Kontrak</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Masa Sewa</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Status</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Keterangan</TableHead>
                    <TableHead className="font-semibold text-right text-slate-600 dark:text-slate-400">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentals.map((rental) => (
                    <TableRow key={rental.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                        {rental.pks?.nomorPks || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-teal-600 text-xs uppercase">
                            {rental.pks?.atm?.kodeAtm || 'N/A'}
                          </span>
                          <span className="text-xs text-slate-500 font-medium truncate max-w-44">
                            {rental.pks?.atm?.lokasi || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(rental.nilaiSewa)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            {formatTanggal(rental.tglMulai)}
                          </span>
                          <span className="flex items-center gap-1 mt-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            {formatTanggal(rental.tglBerakhir)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                        {rental.masaSewa}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          STATUS_KONTRAK_COLOR[rental.status || 'aktif']
                        }`}>
                          {STATUS_KONTRAK_LABEL[rental.status || 'aktif']}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-36 truncate">
                        {rental.keterangan || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-teal-600"
                            onClick={() => openEditModal(rental)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:text-red-600"
                            onClick={() => confirmDelete(rental)}
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
            <DialogTitle>{modalMode === 'add' ? 'Tambah Kontrak Sewa' : 'Edit Kontrak Sewa'}</DialogTitle>
            <DialogDescription>
              Isi data detail transaksi finansial dan periode sewa.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="pksId">Dokumen PKS Terkait <span className="text-red-500">*</span></Label>
              <Select value={pksId} onValueChange={(val) => setPksId(val || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih dokumen PKS..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {pksList.map((pks) => (
                    <SelectItem key={pks.id} value={pks.id}>
                      {pks.nomorPks} (ATM: {pks.atm?.kodeAtm})
                    </SelectItem>
                  ))}
                  {pksList.length === 0 && (
                    <SelectItem value="none" disabled>
                      Tidak ada PKS terdaftar. Silakan buat PKS terlebih dahulu.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nilaiSewa">Nilai Sewa (Rupiah) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Coins className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <Input
                  id="nilaiSewa"
                  type="number"
                  value={nilaiSewa}
                  onChange={(e) => setNilaiSewa(e.target.value)}
                  placeholder="e.g. 15000000"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tglMulai">Tanggal Mulai <span className="text-red-500">*</span></Label>
                <Input
                  id="tglMulai"
                  type="date"
                  value={tglMulai}
                  onChange={(e) => setTglMulai(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tglBerakhir">Tanggal Berakhir <span className="text-red-500">*</span></Label>
                <Input
                  id="tglBerakhir"
                  type="date"
                  value={tglBerakhir}
                  onChange={(e) => setTglBerakhir(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status Kontrak</Label>
              <Select value={status} onValueChange={(val) => setStatus(val || 'aktif')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
                  <SelectItem value="dalam_pemeliharaan">Dalam Pemeliharaan</SelectItem>
                  <SelectItem value="dipindahkan">Dipindahkan</SelectItem>
                  <SelectItem value="dihentikan">Dihentikan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan / Memo</Label>
              <Input
                id="keterangan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="e.g. Perpanjangan kontrak sewa tahun ke-3"
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
              <AlertTriangle className="h-5 w-5" /> Hapus Kontrak Sewa?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data sewa ini? Status monitoring kontrak yang bersangkutan juga akan dihapus.
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
