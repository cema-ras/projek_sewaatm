'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { 
  Monitor, 
  Search, 
  Loader2, 
  X,
  AlertTriangle,
  Calendar,
  Clock,
  RefreshCw
} from 'lucide-react'
import { Sewa, StatusKontrak } from '@/types'
import { formatTanggal, hitungSisaHari, STATUS_KONTRAK_LABEL, STATUS_KONTRAK_COLOR } from '@/lib/utils'

export default function MonitoringPage() {
  const [rentals, setRentals] = useState<Sewa[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Status edit inline states
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchRentals = async (searchQuery = '') => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/rental${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setRentals(json.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data monitoring.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRentals(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const handleStatusChange = async (rentalId: string, newStatus: string, rentalData: Sewa) => {
    setUpdatingId(rentalId)
    try {
      const res = await fetch(`/api/rental/${rentalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pksId: rentalData.pksId,
          nilaiSewa: rentalData.nilaiSewa,
          tglMulai: rentalData.tglMulai,
          tglBerakhir: rentalData.tglBerakhir,
          keterangan: rentalData.keterangan,
          status: newStatus
        })
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      
      // Update local state directly
      setRentals(prev => prev.map(item => item.id === rentalId ? { ...item, status: newStatus as StatusKontrak } : item))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal merubah status.')
    } finally {
      setUpdatingId(null)
    }
  }

  // Filter rentals by status client-side
  const filteredRentals = rentals.filter(rental => {
    if (statusFilter === 'all') return true
    return rental.status === statusFilter
  })

  // Helper untuk sisa hari styling
  const getSisaHariBadge = (sisa: number) => {
    if (sisa < 0) {
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400'
    }
    if (sisa <= 30) {
      return 'bg-orange-100 text-orange-850 border-orange-200 dark:bg-orange-950/30 dark:text-orange-450'
    }
    return 'bg-teal-50 text-teal-850 border-teal-150 dark:bg-teal-950/20 dark:text-teal-400'
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Monitoring Kontrak
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pantau status kontrak, masa berlaku aktif, dan sisa hari sewa mesin ATM.
          </p>
        </div>
        <Button 
          variant="outline"
          size="sm"
          onClick={() => fetchRentals(search)} 
          className="border-slate-200 hover:bg-slate-50 dark:border-slate-800 self-start sm:self-auto"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh Data
        </Button>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari PKS, kode ATM..."
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

        {/* Status Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <Label className="text-slate-500 shrink-0 text-xs font-semibold uppercase">Status:</Label>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
            <SelectTrigger className="w-full sm:w-48 h-9">
              <SelectValue placeholder="Pilih status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
              <SelectItem value="dalam_pemeliharaan">Dalam Pemeliharaan</SelectItem>
              <SelectItem value="dipindahkan">Dipindahkan</SelectItem>
              <SelectItem value="dihentikan">Dihentikan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main card */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Monitor className="h-4 w-4 text-teal-600" />
            Real-time Monitoring
          </CardTitle>
          <CardDescription>Visualisasi status penyewaan dan durasi sisa hari.</CardDescription>
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
          ) : filteredRentals.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-slate-400">
              <Monitor className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium">Tidak ada kontrak dalam kriteria filter ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/55 dark:bg-slate-900/30">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Nomor PKS</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">ATM & Lokasi</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Tanggal Berakhir</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Sisa Hari</TableHead>
                    <TableHead className="font-semibold text-slate-600 dark:text-slate-400">Status Kontrak</TableHead>
                    <TableHead className="font-semibold text-right text-slate-600 dark:text-slate-400">Ubah Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRentals.map((rental) => {
                    const sisa = hitungSisaHari(rental.tglBerakhir)
                    return (
                      <TableRow key={rental.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <TableCell className="font-semibold text-slate-800 dark:text-slate-200">
                          {rental.pks?.nomorPks || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-teal-600 text-xs uppercase">
                              {rental.pks?.atm?.kodeAtm || 'N/A'}
                            </span>
                            <span className="text-xs text-slate-500 font-medium truncate max-w-48">
                              {rental.pks?.atm?.lokasi || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5 text-xs font-semibold">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {formatTanggal(rental.tglBerakhir)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-bold border px-2.5 py-0.5 ${getSisaHariBadge(sisa)}`}>
                            <Clock className="h-3 w-3 mr-1 shrink-0" />
                            {sisa < 0 ? `Lewat ${Math.abs(sisa)} hari` : `${sisa} hari lagi`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            STATUS_KONTRAK_COLOR[rental.status || 'aktif']
                          }`}>
                            {STATUS_KONTRAK_LABEL[rental.status || 'aktif']}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center">
                            {updatingId === rental.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                            ) : (
                              <Select
                                value={rental.status || 'aktif'}
                                onValueChange={(val) => handleStatusChange(rental.id, val || 'aktif', rental)}
                              >
                                <SelectTrigger className="w-36 h-8 text-xs font-medium">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="text-xs">
                                  <SelectItem value="aktif">Aktif</SelectItem>
                                  <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
                                  <SelectItem value="dalam_pemeliharaan">Dalam Pemeliharaan</SelectItem>
                                  <SelectItem value="dipindahkan">Dipindahkan</SelectItem>
                                  <SelectItem value="dihentikan">Dihentikan</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
