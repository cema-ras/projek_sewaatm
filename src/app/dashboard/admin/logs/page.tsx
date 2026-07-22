'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  History, 
  Search, 
  Loader2, 
  X,
  AlertTriangle,
  Eye,
  Info,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { MonitoringAktivitas } from '@/types'
import { formatTanggal } from '@/lib/utils'

export default function LogsAdminPage() {
  const [logs, setLogs] = useState<MonitoringAktivitas[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // JSON Inspector Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<MonitoringAktivitas | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/logs')
      const json = await res.json()
      if (res.status === 403) throw new Error('Akses Ditolak. Halaman ini hanya untuk Administrator.')
      if (json.error) throw new Error(json.error)
      setLogs(json.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data log aktivitas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  // Filter logs by search query
  const filteredLogs = logs.filter(log => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      log.user?.nama?.toLowerCase().includes(q) ||
      log.user?.email?.toLowerCase().includes(q) ||
      log.modul.toLowerCase().includes(q) ||
      log.aksi.toLowerCase().includes(q)
    )
  })

  const openInspector = (log: MonitoringAktivitas) => {
    setSelectedLog(log)
    setIsModalOpen(true)
  }

  const formatJSON = (data: unknown) => {
    if (!data) return 'Tidak ada data'
    return JSON.stringify(data, null, 2)
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
            Audit Activity Log
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pantau dan audit seluruh rekam jejak aktivitas CRUD pengguna di sistem.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari user, modul, aksi..."
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
      </div>

      {/* Main card */}
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History className="h-4 w-4 text-teal-600" />
            Rekam Aktivitas Sistem
          </CardTitle>
          <CardDescription>Jurnal detail audit sistem yang tercatat.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-60 items-center justify-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <span className="ml-2 text-sm">Memuat data...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center text-slate-400">
              <History className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm font-medium">Tidak ada rekam aktivitas ditemukan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/55 dark:bg-slate-900/30">
                  <TableRow>
                    <TableHead className="font-semibold">Tanggal & Waktu</TableHead>
                    <TableHead className="font-semibold">Pengguna</TableHead>
                    <TableHead className="font-semibold">Modul</TableHead>
                    <TableHead className="font-semibold">Aksi</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Data Audit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const logDate = new Date(log.tanggal)
                    const timeStr = logDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    
                    return (
                      <TableRow key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                        <TableCell className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          <span className="flex flex-col">
                            <span className="font-bold flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {formatTanggal(log.tanggal)}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{timeStr} WIB</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                              {log.user?.nama || 'System'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {log.user?.email || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-xs uppercase tracking-wide text-teal-700 dark:text-teal-400">
                          {log.modul}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={`text-[10px] font-bold px-2 py-0.5 ${
                              log.aksi === 'TAMBAH' || log.aksi === 'TAMBAH_USER'
                                ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                                : log.aksi === 'UBAH' || log.aksi === 'UBAH_USER'
                                ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                            }`}
                          >
                            {log.aksi}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-xs">
                            {log.status === 'success' ? (
                              <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            )}
                            <span className="font-semibold text-slate-500 capitalize">{log.status}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs font-semibold text-teal-600 hover:text-teal-700"
                            onClick={() => openInspector(log)}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" /> Lihat Detail
                          </Button>
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

      {/* JSON Inspector Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-teal-600" /> Detail Data Audit
            </DialogTitle>
            <DialogDescription>
              Aksi {selectedLog?.aksi} pada modul {selectedLog?.modul} oleh {selectedLog?.user?.nama}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
            {/* Data Sebelum */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Data Sebelum Perubahan (Before):
              </Label>
              <pre className="text-[11px] p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto font-mono max-h-52">
                {formatJSON(selectedLog?.dataSebelum)}
              </pre>
            </div>

            {/* Data Setelah */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Data Setelah Perubahan (After):
              </Label>
              <pre className="text-[11px] p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto font-mono max-h-52">
                {formatJSON(selectedLog?.dataSetelah)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
