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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Search, 
  Loader2, 
  X,
  AlertTriangle,
  Download,
  Printer,
  Calendar,
  Building2,
  Tag
} from 'lucide-react'
import { Sewa } from '@/types'
import { formatTanggal, formatRupiah, STATUS_KONTRAK_LABEL } from '@/lib/utils'

export default function ReportsPage() {
  const [rentals, setRentals] = useState<Sewa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [lokasi, setLokasi] = useState('')
  const [status, setStatus] = useState('all')
  const [tglMulaiMin, setTglMulaiMin] = useState('')
  const [tglBerakhirMax, setTglBerakhirMax] = useState('')

  const fetchRentals = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/rental')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setRentals(json.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data laporan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRentals()
  }, [])

  // Apply filters client-side
  const filteredRentals = rentals.filter((item) => {
    // Lokasi filter (case-insensitive)
    if (lokasi && !item.pks?.atm?.lokasi?.toLowerCase().includes(lokasi.toLowerCase())) {
      return false
    }
    // Status filter
    if (status !== 'all' && item.status !== status) {
      return false
    }
    // Tanggal Mulai Minimum filter
    if (tglMulaiMin && new Date(item.tglMulai) < new Date(tglMulaiMin)) {
      return false
    }
    // Tanggal Berakhir Maximum filter
    if (tglBerakhirMax && new Date(item.tglBerakhir) > new Date(tglBerakhirMax)) {
      return false
    }
    return true
  })

  // Export to Excel (CSV format)
  const handleExportExcel = () => {
    if (filteredRentals.length === 0) return
    
    // CSV headers
    const headers = ['Nomor PKS', 'Kode ATM', 'Lokasi ATM', 'Cabang Pengelola', 'Nilai Sewa', 'Tanggal Mulai', 'Tanggal Berakhir', 'Masa Sewa', 'Status']
    
    // Map data rows
    const rows = filteredRentals.map(item => [
      `"${item.pks?.nomorPks || ''}"`,
      `"${item.pks?.atm?.kodeAtm || ''}"`,
      `"${item.pks?.atm?.lokasi || ''}"`,
      `"${item.pks?.atm?.branch || ''}"`,
      item.nilaiSewa,
      `"${new Date(item.tglMulai).toLocaleDateString('id-ID')}"`,
      `"${new Date(item.tglBerakhir).toLocaleDateString('id-ID')}"`,
      `"${item.masaSewa || ''}"`,
      `"${STATUS_KONTRAK_LABEL[item.status || 'aktif']}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Laporan_Sewa_ATM_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export to PDF (Print view trigger)
  const handleExportPDF = () => {
    window.print()
  }

  // Calculate sum of visible lease values
  const totalNilaiSewaFiltered = filteredRentals.reduce((sum, item) => sum + item.nilaiSewa, 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Print-only CSS block */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Laporan Sewa ATM
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Filter, cetak, dan ekspor laporan rekapitulasi data sewa ATM BNI.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleExportExcel} 
            disabled={filteredRentals.length === 0}
            variant="outline"
            className="border-slate-200 hover:bg-slate-50 dark:border-slate-800 active:scale-[0.98]"
          >
            <Download className="mr-2 h-4 w-4 text-emerald-600" /> Ekspor Excel
          </Button>
          <Button 
            onClick={handleExportPDF} 
            disabled={filteredRentals.length === 0}
            className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/10 active:scale-[0.98]"
          >
            <Printer className="mr-2 h-4 w-4" /> Cetak PDF
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-800 no-print">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Filter Pencarian Laporan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Lokasi */}
          <div className="space-y-2">
            <Label htmlFor="filter-lokasi" className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" /> Lokasi ATM
            </Label>
            <Input
              id="filter-lokasi"
              placeholder="e.g. Bandara, KCU"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="filter-status" className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" /> Status Kontrak
            </Label>
            <Select value={status} onValueChange={(val) => setStatus(val || 'all')}>
              <SelectTrigger className="w-full">
                <SelectValue />
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

          {/* Tanggal Mulai Min */}
          <div className="space-y-2">
            <Label htmlFor="filter-tgl-mulai" className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" /> Mulai Setelah
            </Label>
            <Input
              id="filter-tgl-mulai"
              type="date"
              value={tglMulaiMin}
              onChange={(e) => setTglMulaiMin(e.target.value)}
            />
          </div>

          {/* Tanggal Berakhir Max */}
          <div className="space-y-2">
            <Label htmlFor="filter-tgl-berakhir" className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" /> Berakhir Sebelum
            </Label>
            <Input
              id="filter-tgl-berakhir"
              type="date"
              value={tglBerakhirMax}
              onChange={(e) => setTglBerakhirMax(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Report area */}
      <div id="print-area">
        {/* Printable page header */}
        <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight">PT. Bank Negara Indonesia (Persero) Tbk</h1>
          <h2 className="text-lg font-semibold text-slate-700">REKAPITULASI LAPORAN DATA PENYEWAAN ATM</h2>
          <p className="text-xs text-slate-400 mt-1">Dicetak pada tanggal: {new Date().toLocaleDateString('id-ID')}</p>
        </div>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="pb-3 flex flex-row items-center justify-between no-print">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" />
                Hasil Rekapitulasi Laporan
              </CardTitle>
              <CardDescription>Menampilkan {filteredRentals.length} kontrak sewa ATM.</CardDescription>
            </div>
            <Badge variant="secondary" className="font-bold bg-teal-50 text-teal-700 hover:bg-teal-50">
              Total Nilai: {formatRupiah(totalNilaiSewaFiltered)}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <div className="m-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400 no-print">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex h-60 items-center justify-center text-slate-500 no-print">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <span className="ml-2 text-sm">Memuat data...</span>
              </div>
            ) : filteredRentals.length === 0 ? (
              <div className="flex h-60 flex-col items-center justify-center text-slate-400">
                <FileText className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium">Tidak ada data untuk kriteria ini.</p>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader className="bg-slate-50/55 dark:bg-slate-900/30">
                    <TableRow>
                      <TableHead className="font-semibold">Nomor PKS</TableHead>
                      <TableHead className="font-semibold">ATM</TableHead>
                      <TableHead className="font-semibold">Lokasi ATM</TableHead>
                      <TableHead className="font-semibold">Cabang</TableHead>
                      <TableHead className="font-semibold">Nilai Sewa</TableHead>
                      <TableHead className="font-semibold">Mulai</TableHead>
                      <TableHead className="font-semibold">Berakhir</TableHead>
                      <TableHead className="font-semibold">Masa Sewa</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRentals.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{item.pks?.nomorPks || '-'}</TableCell>
                        <TableCell className="font-bold text-teal-700 dark:text-teal-400">{item.pks?.atm?.kodeAtm || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{item.pks?.atm?.lokasi || '-'}</TableCell>
                        <TableCell>{item.pks?.atm?.branch || '-'}</TableCell>
                        <TableCell className="font-bold">{formatRupiah(item.nilaiSewa)}</TableCell>
                        <TableCell className="text-xs">{formatTanggal(item.tglMulai)}</TableCell>
                        <TableCell className="text-xs">{formatTanggal(item.tglBerakhir)}</TableCell>
                        <TableCell className="text-xs">{item.masaSewa}</TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold uppercase">{STATUS_KONTRAK_LABEL[item.status || 'aktif']}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Print only Summary & Signature fields */}
                <div className="hidden print:flex justify-between items-center mt-12 px-6 pt-6 border-t border-slate-200">
                  <div className="text-sm">
                    <p className="font-bold">Total Nilai Sewa Rekapitulasi: </p>
                    <p className="text-lg font-bold text-emerald-800 mt-1">{formatRupiah(totalNilaiSewaFiltered)}</p>
                  </div>
                  <div className="text-center text-sm w-56">
                    <p>Mengetahui,</p>
                    <p className="font-semibold mt-16">( ___________________________ )</p>
                    <p className="text-xs text-slate-500 mt-1">Supervisi ATM BNI</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
