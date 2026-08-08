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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  Coins,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  ExternalLink,
  Upload,
} from 'lucide-react'
import { Sewa, Pks } from '@/types'
import {
  formatTanggal,
  formatRupiah,
  STATUS_KONTRAK_LABEL,
  STATUS_KONTRAK_COLOR,
  truncateFileName,
  getCleanFileName,
  hitungTotalNilaiSewa,
} from '@/lib/utils'

export default function RentalPage() {
  const [rentals, setRentals] = useState<Sewa[]>([])
  const [pksList, setPksList] = useState<Pks[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  // PDF states
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [existingPdf, setExistingPdf] = useState<string | null>(null)
  const [removePdf, setRemovePdf] = useState(false)

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
      const res = await fetch(
        `/api/rental${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`
      )
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
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Pagination calculations
  const totalPages = Math.ceil(rentals.length / pageSize) || 1
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const startIndex = (validCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, rentals.length)
  const paginatedRentals = rentals.slice(startIndex, endIndex)

  useEffect(() => {
    fetchPksList()
  }, [])

  // -------------------------------------------------------------
  // Fungsi Helper untuk Format Ribuan di Input
  // -------------------------------------------------------------
  const handleNilaiSewaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '')
    const formattedValue = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    setNilaiSewa(formattedValue)
  }

  const openAddModal = () => {
    setModalMode('add')
    setSelectedRentalId(null)
    setPksId('')
    setNilaiSewa('')
    setTglMulai('')
    setTglBerakhir('')
    setKeterangan('')
    setStatus('aktif')
    setPdfFile(null)
    setExistingPdf(null)
    setRemovePdf(false)
    setIsModalOpen(true)
  }

  const openEditModal = (rental: Sewa) => {
    setModalMode('edit')
    setSelectedRentalId(rental.id)
    setPksId(rental.pksId)

    const rawSewa = String(rental.nilaiSewa).replace(/\D/g, '')
    setNilaiSewa(rawSewa.replace(/\B(?=(\d{3})+(?!\d))/g, '.'))

    setKeterangan(rental.keterangan || '')
    setStatus(rental.status || 'aktif')

    const startObj = new Date(rental.tglMulai)
    const endObj = new Date(rental.tglBerakhir)
    setTglMulai(startObj.toISOString().split('T')[0])
    setTglBerakhir(endObj.toISOString().split('T')[0])

    setExistingPdf(rental.filePdf || null)
    setPdfFile(null)
    setRemovePdf(false)

    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pksId) {
      alert('Pilih dokumen PKS terlebih dahulu.')
      return
    }

    setSaving(true)

    try {
      const url = modalMode === 'add' ? '/api/rental' : `/api/rental/${selectedRentalId}`
      const method = modalMode === 'add' ? 'POST' : 'PUT'

      const formData = new FormData()
      formData.append('pksId', pksId)
      formData.append('nilaiSewa', nilaiSewa.replace(/\./g, ''))
      formData.append('tglMulai', tglMulai)
      formData.append('tglBerakhir', tglBerakhir)
      formData.append('keterangan', keterangan)
      formData.append('status', status)

      if (pdfFile) {
        formData.append('filePdf', pdfFile)
      }
      if (removePdf) {
        formData.append('removePdf', 'true')
      }

      const res = await fetch(url, {
        method,
        body: formData,
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
        method: 'DELETE',
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

  const selectedPks = pksList.find((pks) => pks.id === pksId)

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Data Sewa
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola transaksi nilai sewa, periode sewa, lampiran PDF, dan integrasi dengan dokumen
            PKS ATM.
          </p>
        </div>

        {/* Container untuk Alert & Button */}
        <div className="flex flex-col gap-3 self-start sm:flex-row sm:items-center lg:self-auto">
          {/* Peringatan Kedip-Kedip */}
          <div className="flex animate-pulse items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Isi Data PKS terlebih dahulu sebelum mengisi Data Sewa</span>
          </div>

          <Button
            onClick={openAddModal}
            className="w-full bg-teal-600 text-white shadow-md shadow-teal-500/10 hover:bg-teal-700 active:scale-[0.98] sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Sewa
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="flex flex-col gap-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <CalendarClock className="h-4 w-4 text-teal-600" />
              Kontrak Sewa
            </CardTitle>
            <CardDescription>
              Integrasi nilai transaksi sewa, durasi kontrak, dan dokumen PDF.
            </CardDescription>
          </div>
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari PKS, kode ATM, keterangan..."
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
          ) : rentals.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-slate-400">
              <CalendarClock className="mb-2 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium">Tidak ada kontrak sewa ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/55 dark:bg-slate-900/30">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Nomor PKS
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Kode & Lokasi ATM
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Periode Kontrak
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Masa Sewa
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Nilai Sewa
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Total Nilai Sewa
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Dokumen PDF
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Keterangan
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-400">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRentals.map((rental) => (
                    <TableRow
                      key={rental.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
                    >
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                        {rental.pks?.nomorPks || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-teal-600 uppercase">
                            {rental.pks?.atm?.kodeAtm || 'N/A'}
                          </span>
                          <span className="max-w-44 truncate text-xs font-medium text-slate-500">
                            {rental.pks?.atm?.lokasi || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            {formatTanggal(rental.tglMulai)}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            {formatTanggal(rental.tglBerakhir)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {rental.masaSewa}
                      </TableCell>
                      <TableCell className="font-bold text-emerald-700 dark:text-emerald-400">
                        {formatRupiah(rental.nilaiSewa)}
                      </TableCell>
                      <TableCell className="font-extrabold text-teal-700 dark:text-teal-400">
                        {formatRupiah(
                          rental.totalNilaiSewa ||
                            hitungTotalNilaiSewa(
                              rental.nilaiSewa,
                              rental.tglMulai,
                              rental.tglBerakhir
                            )
                        )}
                      </TableCell>
                      <TableCell>
                        {rental.filePdf ? (
                          <a
                            href={rental.filePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/80 px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/60"
                            title="Lihat / Download File PDF"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span>Dokumen</span>
                            <ExternalLink className="h-3 w-3 opacity-70" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-600">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                            STATUS_KONTRAK_COLOR[rental.status || 'aktif']
                          }`}
                        >
                          {STATUS_KONTRAK_LABEL[
                            rental.status as keyof typeof STATUS_KONTRAK_LABEL
                          ] || 'Aktif'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-36 truncate text-xs text-slate-500">
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

          {/* Controls & Pagination Footer */}
          {!loading && rentals.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
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
                  Menampilkan{' '}
                  <strong className="font-semibold text-slate-800 dark:text-slate-200">
                    {startIndex + 1}
                  </strong>{' '}
                  -{' '}
                  <strong className="font-semibold text-slate-800 dark:text-slate-200">
                    {endIndex}
                  </strong>{' '}
                  dari{' '}
                  <strong className="font-semibold text-slate-800 dark:text-slate-200">
                    {rentals.length}
                  </strong>{' '}
                  Sewa
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'add' ? 'Tambah Kontrak Sewa' : 'Edit Kontrak Sewa'}
            </DialogTitle>
            <DialogDescription>
              Isi data detail transaksi finansial, periode sewa, dan dokumen pendukung.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pksId">
                Dokumen PKS Terkait <span className="text-red-500">*</span>
              </Label>
              <Select value={pksId} onValueChange={(val) => setPksId(val || '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih dokumen PKS...">
                    {selectedPks
                      ? `${selectedPks.nomorPks} (ATM: ${selectedPks.atm?.kodeAtm || '-'})`
                      : 'Pilih dokumen PKS...'}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent className="max-h-56">
                  {pksList.map((pks) => (
                    <SelectItem key={pks.id} value={pks.id}>
                      {pks.nomorPks} (ATM: {pks.atm?.kodeAtm || '-'})
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
              <Label htmlFor="nilaiSewa">
                Nilai Sewa (Rupiah) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Coins className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <Input
                  id="nilaiSewa"
                  type="text"
                  inputMode="numeric"
                  value={nilaiSewa}
                  onChange={handleNilaiSewaChange}
                  placeholder="e.g. 15.000.000"
                  className="pl-9"
                  required
                />
              </div>
              {nilaiSewa && tglMulai && tglBerakhir && Number(nilaiSewa.replace(/\./g, '')) > 0 && (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs dark:border-emerald-900/50 dark:bg-emerald-950/40">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Total Nilai Sewa (Masa Kontrak):
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {formatRupiah(
                      hitungTotalNilaiSewa(
                        Number(nilaiSewa.replace(/\./g, '')),
                        tglMulai,
                        tglBerakhir
                      )
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tglMulai">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tglMulai"
                  type="date"
                  value={tglMulai}
                  onChange={(e) => setTglMulai(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tglBerakhir">
                  Tanggal Berakhir <span className="text-red-500">*</span>
                </Label>
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
                  <SelectValue placeholder="Pilih status...">
                    {status
                      ? (STATUS_KONTRAK_LABEL as Record<string, string>)[status] ||
                        'Pilih status...'
                      : 'Pilih status...'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_KONTRAK_LABEL).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {String(label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Field Upload PDF */}
            <div className="space-y-2">
              <Label htmlFor="pdfFile">Dokumen Kontrak PDF</Label>
              {existingPdf && !removePdf ? (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex min-w-0 items-center gap-2 text-xs">
                    <FileText className="h-4 w-4 shrink-0 text-red-500" />
                    <span
                      className="block max-w-[150px] truncate font-medium text-slate-700 sm:max-w-[220px] dark:text-slate-300"
                      title={getCleanFileName(existingPdf)}
                    >
                      {truncateFileName(existingPdf, 22)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <a
                      href={existingPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 items-center gap-1 rounded bg-teal-50 px-2 text-xs font-semibold text-teal-600 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-400"
                    >
                      <ExternalLink className="h-3 w-3" /> Lihat
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                      onClick={() => {
                        setRemovePdf(true)
                        setPdfFile(null)
                      }}
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Hapus
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Input
                      id="pdfFile"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (
                            !file.type.includes('pdf') &&
                            !file.name.toLowerCase().endsWith('.pdf')
                          ) {
                            alert('File harus berformat PDF.')
                            e.target.value = ''
                            return
                          }
                          setPdfFile(file)
                          setRemovePdf(false)
                        }
                      }}
                      className="cursor-pointer text-xs"
                    />
                  </div>
                  {pdfFile && (
                    <div className="flex items-center justify-between rounded-md bg-teal-50 px-2.5 py-1 text-xs text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                      <span className="max-w-[200px] truncate font-medium" title={pdfFile.name}>
                        Akan diupload: {truncateFileName(pdfFile.name, 22)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPdfFile(null)}
                        className="ml-2 text-slate-400 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Format file: PDF (Maksimal 10MB)
                  </p>
                </div>
              )}
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

            <DialogFooter className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-teal-600 text-white hover:bg-teal-700"
                disabled={saving}
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
              <AlertTriangle className="h-5 w-5" /> Hapus Kontrak Sewa?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data sewa ini? Status monitoring kontrak serta file
              PDF pendukung yang tersimpan juga akan dihapus.
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
