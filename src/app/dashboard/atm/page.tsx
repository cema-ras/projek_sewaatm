'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
} from 'lucide-react'
import { Atm } from '@/types'

export default function AtmPage() {
  const [atms, setAtms] = useState<Atm[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Form/Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedAtmId, setSelectedAtmId] = useState<string | null>(null)

  const [kodeAtm, setKodeAtm] = useState('')
  const [kodeAtmLama, setKodeAtmLama] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [jenisMesin, setJenisMesin] = useState<string[]>([])
  const [cabangPengelola, setCabangPengelola] = useState('')
  const [branch, setBranch] = useState(false)
  const [koordinat, setKoordinat] = useState('')
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
      const res = await fetch(
        `/api/atm${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`
      )
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
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Pagination calculations
  const totalPages = Math.ceil(atms.length / pageSize) || 1
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const startIndex = (validCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, atms.length)
  const paginatedAtms = atms.slice(startIndex, endIndex)

  const openAddModal = () => {
    setModalMode('add')
    setSelectedAtmId(null)
    setKodeAtm('')
    setKodeAtmLama('')
    setLokasi('')
    setJenisMesin([])
    setCabangPengelola('')
    setBranch(false)
    setKoordinat('')
    setIsModalOpen(true)
  }

  const openEditModal = (atm: Atm) => {
    setModalMode('edit')
    setSelectedAtmId(atm.id)
    setKodeAtm(atm.kodeAtm)
    setKodeAtmLama(atm.kodeAtmLama || '')
    setLokasi(atm.lokasi)

    // Parsing string "ATM, CRM" kembali menjadi array ['ATM', 'CRM']
    setJenisMesin(atm.jenisMesin ? atm.jenisMesin.split(', ') : [])
    setCabangPengelola(atm.cabangPengelola || '')

    // Memastikan nilai toggle branch sesuai (konversi ke boolean jika dari backend berupa string)
    setBranch(atm.branch === true || atm.branch === 'true')

    if (atm.latitude !== undefined && atm.latitude !== null && atm.longitude !== undefined && atm.longitude !== null) {
      setKoordinat(`${atm.latitude}, ${atm.longitude}`)
    } else {
      setKoordinat('')
    }

    setIsModalOpen(true)
  }

  const handleJenisMesinChange = (checked: boolean, value: string) => {
    if (checked) {
      setJenisMesin([...jenisMesin, value])
    } else {
      setJenisMesin(jenisMesin.filter((item) => item !== value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    let parsedLat: number | null = null
    let parsedLng: number | null = null
    if (koordinat.trim()) {
      const parts = koordinat.split(',').map((p) => p.trim())
      if (parts.length >= 2) {
        const lat = Number(parts[0])
        const lng = Number(parts[1])
        if (!isNaN(lat) && !isNaN(lng)) {
          parsedLat = lat
          parsedLng = lng
        }
      }
    }

    const payload = {
      kodeAtm,
      kodeAtmLama: kodeAtmLama || null,
      lokasi,
      jenisMesin: jenisMesin.join(', '), // Format ke string agar mudah disimpan
      cabangPengelola,
      branch,
      latitude: parsedLat,
      longitude: parsedLng,
    }

    try {
      const url = modalMode === 'add' ? '/api/atm' : `/api/atm/${selectedAtmId}`
      const method = modalMode === 'add' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        method: 'DELETE',
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
    <div className="animate-in fade-in space-y-6 duration-300">
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
          className="self-start bg-teal-600 text-white shadow-md shadow-teal-500/10 hover:bg-teal-700 active:scale-[0.98] sm:self-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah ATM
        </Button>
      </div>

      {/* Main card */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="flex flex-col gap-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
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
              className="h-9 pl-9"
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
              <Building2 className="mb-2 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium">Tidak ada data ATM ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/55 dark:bg-slate-900/30">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Kode ATM
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Kode Lama
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Lokasi
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Jenis
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Cabang Pengelola
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Status Branch
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Koordinat
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-400">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAtms.map((atm) => (
                    <TableRow
                      key={atm.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
                    >
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                        {atm.kodeAtm}
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400">
                        {atm.kodeAtmLama ? (
                          <Badge variant="secondary" className="font-medium">
                            {atm.kodeAtmLama}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-300 italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                        {atm.lokasi}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        <Badge
                          variant="outline"
                          className="border-teal-200 bg-teal-50 text-teal-700"
                        >
                          {atm.jenisMesin}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {atm.cabangPengelola || '-'}
                      </TableCell>
                      <TableCell>
                        {atm.branch ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600">On Branch</Badge>
                        ) : (
                          <Badge variant="secondary">Off Branch</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {atm.latitude !== null && atm.latitude !== undefined && atm.longitude !== null && atm.longitude !== undefined ? (
                          <a
                            href={`https://www.google.com/maps?q=${atm.latitude},${atm.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100 hover:underline dark:bg-teal-950/50 dark:text-teal-300"
                            title="Buka lokasi di Google Maps"
                          >
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                            <span>
                              {atm.latitude}, {atm.longitude}
                            </span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300 italic dark:text-slate-600">-</span>
                        )}
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

          {/* Controls & Pagination Footer */}
          {!loading && atms.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Baris per halaman:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(val) => {
                      setPageSize(Number(val))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-16 text-xs">
                      <SelectValue placeholder={pageSize.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span>
                  Menampilkan <strong className="font-semibold text-slate-800 dark:text-slate-200">{startIndex + 1}</strong> - <strong className="font-semibold text-slate-800 dark:text-slate-200">{endIndex}</strong> dari <strong className="font-semibold text-slate-800 dark:text-slate-200">{atms.length}</strong> ATM
                </span>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={validCurrentPage === 1}
                  title="Halaman Pertama"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={validCurrentPage === 1}
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="px-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  Halaman {validCurrentPage} dari {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={validCurrentPage === totalPages}
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validCurrentPage === totalPages}
                  title="Halaman Terakhir"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{modalMode === 'add' ? 'Tambah ATM Baru' : 'Edit Data ATM'}</DialogTitle>
            <DialogDescription>Isi data detail fisik mesin ATM di bawah ini.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kodeAtm">
                  Kode ATM <span className="text-red-500">*</span>
                </Label>
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
              <Label htmlFor="lokasi">
                Lokasi Penempatan <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lokasi"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                placeholder="e.g. Bandara Soekarno Hatta T3"
                required
              />
            </div>

            {/* Input Titik Koordinat (Single Input: Latitude, Longitude) */}
            <div className="space-y-2">
              <Label htmlFor="koordinat" className="text-sm font-medium">
                Titik Koordinat (Latitude, Longitude)
              </Label>
              <Input
                id="koordinat"
                value={koordinat}
                onChange={(e) => setKoordinat(e.target.value)}
                placeholder="e.g. -5.16798, 119.43268"
              />
              <p className="text-[12px] text-slate-500 dark:text-slate-400">
                Pisahkan latitude dan longitude dengan koma (contoh: <code className="font-mono text-teal-600 dark:text-teal-400">-5.16798, 119.43268</code>).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2">
              {/* Input Checkbox untuk Jenis Mesin */}
              <div className="space-y-3">
                <Label>
                  Jenis Mesin <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-col gap-3 pt-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="jenis-atm"
                      checked={jenisMesin.includes('ATM')}
                      onCheckedChange={(checked) =>
                        handleJenisMesinChange(checked as boolean, 'ATM')
                      }
                    />
                    <Label
                      htmlFor="jenis-atm"
                      className="cursor-pointer font-normal text-slate-700"
                    >
                      ATM (Anjungan Tunai Mandiri)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="jenis-crm"
                      checked={jenisMesin.includes('CRM')}
                      onCheckedChange={(checked) =>
                        handleJenisMesinChange(checked as boolean, 'CRM')
                      }
                    />
                    <Label
                      htmlFor="jenis-crm"
                      className="cursor-pointer font-normal text-slate-700"
                    >
                      CRM (Cash Recycle Machine)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Input Toggle (Switch) untuk Branch */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="branch-toggle" className="text-sm font-medium">
                      Status Branch
                    </Label>
                    <p className="text-[12px] text-slate-500">
                      Aktifkan jika mesin di area cabang.
                    </p>
                  </div>
                  <Switch id="branch-toggle" checked={branch} onCheckedChange={setBranch} />
                </div>
              </div>
            </div>

            {/* Input Dropdown untuk Cabang Pengelola */}
            <div className="space-y-2">
              <Label>
                Cabang Pengelola <span className="text-red-500">*</span>
              </Label>
              <Select
                value={cabangPengelola}
                onValueChange={(val) => setCabangPengelola(val || '')}
                required
              >
                {/* Penambahan w-full dilakukan di class SelectTrigger di bawah ini */}
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih cabang pengelola" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KCU Harmoni">KCU Harmoni</SelectItem>
                  <SelectItem value="KCU Sudirman">KCU Sudirman</SelectItem>
                  <SelectItem value="KCU Makassar">KCU Makassar</SelectItem>
                  <SelectItem value="KCU Mattoangin">KCU Mattoangin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 text-white hover:bg-teal-700"
                disabled={saving || jenisMesin.length === 0}
              >
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
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" /> Hapus Data ATM?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data ATM <strong>{atmToDelete?.kodeAtm}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 pt-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
