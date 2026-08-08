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
  FileSpreadsheet,
  Search,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Pks, Atm } from '@/types'
import { formatTanggal } from '@/lib/utils'

export default function PksPage() {
  const [pksList, setPksList] = useState<Pks[]>([])
  const [atms, setAtms] = useState<Atm[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedPksId, setSelectedPksId] = useState<string | null>(null)

  const [atmId, setAtmId] = useState('')
  const [kodeATM, setKodeATM] = useState('')
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
      const res = await fetch(
        `/api/pks${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`
      )
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
      setCurrentPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Pagination calculations
  const totalPages = Math.ceil(pksList.length / pageSize) || 1
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const startIndex = (validCurrentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, pksList.length)
  const paginatedPksList = pksList.slice(startIndex, endIndex)

  useEffect(() => {
    fetchAtms()
  }, [])

  const openAddModal = () => {
    setModalMode('add')
    setSelectedPksId(null)
    setAtmId('')
    setKodeATM('')
    setNomorPks('')
    setTanggalPks('')
    setIsModalOpen(true)
  }

  const openEditModal = (pks: Pks) => {
    setModalMode('edit')
    setSelectedPksId(pks.id)
    setAtmId(pks.atmId)
    setKodeATM('')
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
      kodeATM,
      nomorPks,
      tanggalPks,
    }

    try {
      const url = modalMode === 'add' ? '/api/pks' : `/api/pks/${selectedPksId}`
      const method = modalMode === 'add' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        method: 'DELETE',
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

  const selectedAtm = atms.find((atm) => atm.id === atmId)

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Perjanjian Kerja Sama (PKS)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola dokumen PKS legal sewa tempat penempatan ATM.
          </p>
        </div>

        {/* Container untuk Alert & Button */}
        <div className="flex flex-col gap-3 self-start sm:flex-row sm:items-center lg:self-auto">
          {/* Peringatan Kedip-Kedip */}
          <div className="flex animate-pulse items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Isi Data ATM terlebih dahulu sebelum mengisi Data PKS</span>
          </div>

          <Button
            onClick={openAddModal}
            className="w-full bg-teal-600 text-white shadow-md shadow-teal-500/10 hover:bg-teal-700 active:scale-[0.98] sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah PKS
          </Button>
        </div>
      </div>

      {/* Main card */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="flex flex-col gap-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
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
          ) : pksList.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-slate-400">
              <FileSpreadsheet className="mb-2 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium">Tidak ada data PKS ditemukan.</p>
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
                      Mesin ATM Terkait
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Lokasi ATM
                    </TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">
                      Tanggal Dokumen
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-400">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPksList.map((pks) => (
                    <TableRow
                      key={pks.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
                    >
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                        {pks.nomorPks}
                      </TableCell>
                      <TableCell>
                        {pks.atm?.isDeleted ? (
                          <Badge className="animate-pulse border border-red-200 bg-red-100 font-bold text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
                            <AlertTriangle className="mr-1 h-3 w-3 shrink-0" />
                            ATM Dihapus
                          </Badge>
                        ) : (
                          <Badge className="bg-teal-600 font-bold hover:bg-teal-700">
                            {pks.atm?.kodeAtm || 'Tidak Ditemukan'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                        {pks.atm?.lokasi || '-'}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
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

          {/* Controls & Pagination Footer */}
          {!loading && pksList.length > 0 && (
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
                    {pksList.length}
                  </strong>{' '}
                  PKS
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'add' ? 'Tambah Dokumen PKS' : 'Edit Dokumen PKS'}
            </DialogTitle>
            <DialogDescription>Isi data detail perjanjian legal di bawah ini.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="atmId">
                Mesin ATM Terkait <span className="text-red-500">*</span>
              </Label>
              <Select value={atmId} onValueChange={(val) => setAtmId(val || '')}>
                <SelectTrigger className="w-full">
                  {/* Paksa SelectValue menampilkan format teks dari selectedAtm */}
                  <SelectValue placeholder="Pilih mesin ATM...">
                    {selectedAtm
                      ? `${selectedAtm.kodeAtm} - ${selectedAtm.lokasi} (${selectedAtm.branch ? 'On Branch' : 'Off Branch'})`
                      : 'Pilih mesin ATM...'}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent className="max-h-56">
                  {atms
                    .filter((atm) => !atm.isDeleted || atm.id === atmId)
                    .map((atm) => (
                      <SelectItem key={atm.id} value={atm.id}>
                        {atm.kodeAtm} - {atm.lokasi} ({atm.branch ? 'On Branch' : 'Off Branch'})
                        {atm.isDeleted ? ' (ATM Dihapus)' : ''}
                      </SelectItem>
                    ))}

                  {atms.filter((atm) => !atm.isDeleted).length === 0 && (
                    <SelectItem value="none" disabled>
                      Tidak ada ATM terdaftar. Silakan buat ATM terlebih dahulu.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomorPks">
                Nomor PKS <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nomorPks"
                value={nomorPks}
                onChange={(e) => setNomorPks(e.target.value)}
                placeholder="e.g. 123/PKS/BNI/2026"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggalPks">
                Tanggal Penandatanganan <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tanggalPks"
                type="date"
                value={tanggalPks}
                onChange={(e) => setTanggalPks(e.target.value)}
                required
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
              <AlertTriangle className="h-5 w-5" /> Hapus Dokumen PKS?
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus dokumen PKS <strong>{pksToDelete?.nomorPks}</strong>
              ? Tindakan ini tidak dapat dibatalkan.
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
