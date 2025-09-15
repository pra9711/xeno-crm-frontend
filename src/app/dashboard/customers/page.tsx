'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Spinner from '@/components/Spinner'
import { Plus, Search, Eye, Edit, Trash2, Filter, Download, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
// simple dropdown implemented inline (avoids adding new UI component imports)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/badge'
import useApi from '@/lib/useApi'
import { useToast } from '@/components/toast/ToastProvider'
import { normalizeListAndPagination } from '@/lib/pagination'
import { getInitials } from '@/lib/utils'
import type { Customer } from '@/types'

export default function CustomersPage() {
  // Note: this page relies on `normalizeListAndPagination` to defensively
  // handle various backend list shapes (array, { data: [...] }, { items: [...] }).
  // Dev/mock data should only be enabled with `NEXT_PUBLIC_USE_MOCKS === 'true'`.
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [loadingMore, setLoadingMore] = useState(false)

  const apiClient = useApi()
  const toast = useToast()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterHasEmail, setFilterHasEmail] = useState<boolean | null>(null)
  const [filterHasPhone, setFilterHasPhone] = useState<boolean | null>(null)
  const filterButtonRef = useRef<HTMLButtonElement | null>(null)
  const [filterRect, setFilterRect] = useState<DOMRect | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')
  const [exportFields, setExportFields] = useState<Record<string, boolean>>({ name: true, email: true, phone: false, totalSpending: true, visitCount: true, lastVisit: false, status: true })

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), limit: '10', ...(searchTerm ? { search: searchTerm } : {}) })
        const resp = await apiClient.request<unknown>({ method: 'get', url: `/customers?${params}` })
        if (!mounted) return

        if (!resp.ok) {
          if (resp.status === 401) {
            setCustomers([])
            setTotalPages(1)
            return
          }
          console.error('Customers fetch failed', resp.error)
          return
        }

  const raw = (resp.data ?? resp) as any
  const { list, pagination } = normalizeListAndPagination<Customer>(raw.data ?? raw)
        setCustomers(list)
        setTotalPages(pagination && typeof pagination.pages === 'number' ? pagination.pages : 1)
      } catch (err) {
        console.error('Error loading customers', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm])

  // small no-op placeholders removed; state is used directly in JSX and handlers

  // Delete flow now uses a confirmation modal instead of browser confirm()
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const resp = await apiClient.request({ method: 'delete', url: `/customers/${deleteTarget.id}` })
      if (!resp.ok) {
        toast.show({ message: `Failed to delete customer — ${resp.error || 'Unknown error'}` })
        setDeleteTarget(null)
        return
      }
      setCustomers((s) => s.filter((c) => c.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      toast.show({ message: 'Failed to delete customer' })
      setDeleteTarget(null)
    }
  }

  const cancelDelete = () => setDeleteTarget(null)

  const filteredCustomers = customers.filter((c) => {
    if (filterHasEmail !== null) {
      if (filterHasEmail && !c.email) return false
      if (!filterHasEmail && c.email) return false
    }
    if (filterHasPhone !== null) {
      if (filterHasPhone && !c.phone) return false
      if (!filterHasPhone && c.phone) return false
    }
    return true
  })

  const exportCsv = () => {
    const selectedFields = Object.keys(exportFields).filter((k) => exportFields[k])
    if (selectedFields.length === 0) {
      toast.show({ message: 'Please select at least one field to export' })
      return
    }

    const rows = filteredCustomers.map((c) => {
      const row: Record<string, string> = {}
      selectedFields.forEach((f) => {
        switch (f) {
          case 'name': row[f] = c.name; break
          case 'email': row[f] = c.email ?? ''; break
          case 'phone': row[f] = c.phone ?? ''; break
          case 'totalSpending': row[f] = String(c.totalSpending ?? 0); break
          case 'visitCount': row[f] = String(c.visitCount ?? 0); break
          case 'lastVisit': row[f] = c.lastVisit ? new Date(c.lastVisit).toISOString() : ''; break
          case 'status': row[f] = (c.visitCount ?? 0) > 0 ? 'Active' : 'Inactive'; break
          default: row[f] = (c as any)[f] ?? ''
        }
      })
      return row
    })

    if (rows.length === 0) {
      toast.show({ message: 'No customers to export' })
      return
    }

    const header = selectedFields
    const csv = [header.join(',')].concat(rows.map(r => header.map(h => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(','))).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers_export_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const exportExcel = async () => {
    const selectedFields = Object.keys(exportFields).filter((k) => exportFields[k])
  if (selectedFields.length === 0) return toast.show({ message: 'Select at least one field' })
    try {
      const XLSX = await import('xlsx')
      const data = filteredCustomers.map(c => {
        const row: Record<string, any> = {}
        selectedFields.forEach(f => {
          switch (f) {
            case 'name': row['Name'] = c.name; break
            case 'email': row['Email'] = c.email ?? ''; break
            case 'phone': row['Phone'] = c.phone ?? ''; break
            case 'totalSpending': row['Total Spending'] = c.totalSpending ?? 0; break
            case 'visitCount': row['Visits'] = c.visitCount ?? 0; break
            case 'lastVisit': row['Last Visit'] = c.lastVisit ? new Date(c.lastVisit).toISOString() : ''; break
            case 'status': row['Status'] = (c.visitCount ?? 0) > 0 ? 'Active' : 'Inactive'; break
            default: row[f] = (c as any)[f] ?? ''
          }
        })
        return row
      })

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Customers')
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customers_${new Date().toISOString().slice(0,10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Excel export failed', err)
      toast.show({ message: 'Excel export failed' })
    }
  }

  const exportPdf = async () => {
    const selectedFields = Object.keys(exportFields).filter((k) => exportFields[k])
  if (selectedFields.length === 0) return toast.show({ message: 'Select at least one field' })
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const startY = 40
      doc.setFontSize(12)
      let y = startY
      const header = selectedFields.map(k => ({ key: k, label: ({ name: 'Name', email: 'Email', phone: 'Phone', totalSpending: 'Total Spending', visitCount: 'Visits', lastVisit: 'Last Visit', status: 'Status' } as Record<string,string>)[k] }))
      // simple table output
      doc.text('Customers Export', 40, y)
      y += 20
      // header
      header.forEach((h, i) => doc.text(h.label, 40 + i * 120, y))
      y += 16
      filteredCustomers.forEach(c => {
        selectedFields.forEach((f, i) => {
          let text = ''
          switch (f) {
            case 'name': text = c.name; break
            case 'email': text = c.email ?? ''; break
            case 'phone': text = c.phone ?? ''; break
            case 'totalSpending': text = String(c.totalSpending ?? 0); break
            case 'visitCount': text = String(c.visitCount ?? 0); break
            case 'lastVisit': text = c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : ''; break
            case 'status': text = (c.visitCount ?? 0) > 0 ? 'Active' : 'Inactive'; break
            default: text = (c as any)[f] ?? ''
          }
          doc.text(String(text), 40 + i * 120, y)
        })
        y += 16
        if (y > 750) { doc.addPage(); y = 40 }
      })
      doc.save(`customers_${new Date().toISOString().slice(0,10)}.pdf`)
    } catch (err) {
      console.error('PDF export failed', err)
      toast.show({ message: 'PDF export failed' })
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  // Modal component defined inside page so it has access to handlers and state
  function CustomersPageModalInner() {
    if (!exportOpen) return null
    if (typeof document === 'undefined') return null

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExportOpen(false) }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }, [])

    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setExportOpen(false)} />
        <div className="relative z-[10000] w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold">Export Customer Data</h3>
              <p className="text-sm text-slate-500 mt-1">Download your customer data in various formats for analysis or backup</p>
            </div>
            <div className="ml-auto flex items-start gap-2">
              <div className="text-sm text-slate-600 mt-1 mr-2">{Object.values(exportFields).filter(Boolean).length} fields • {filteredCustomers.length} customers</div>
              <button onClick={() => setExportOpen(false)} aria-label="Close export" className="text-slate-400 hover:text-slate-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-200">✕</button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium mb-3">Export Format</div>
              <div className="flex gap-3">
                {(['csv','excel','pdf'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setExportFormat(f)}
                    className={`flex-1 py-3 rounded-2xl border transition-shadow flex items-center justify-center ${exportFormat === f ? 'border-transparent bg-gradient-to-r from-[#9B5CFF] to-[#7C3AED] text-white shadow-md' : 'border-gray-100 bg-white hover:shadow-sm'}`}
                  >
                    <div className="text-center font-medium text-sm">{f === 'csv' ? 'CSV' : f === 'excel' ? 'Excel' : 'PDF'}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Fields to Export</div>
                <div className="text-sm">
                  <button onClick={() => setExportFields(Object.fromEntries(Object.keys(exportFields).map(k => [k, true])))} className="text-sm text-slate-500 mr-3">Select All</button>
                  <button onClick={() => setExportFields(Object.fromEntries(Object.keys(exportFields).map(k => [k, false])))} className="text-sm text-slate-500">Clear All</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {Object.keys(exportFields).map((key) => (
                  <button key={`export-field-${key}`} onClick={() => setExportFields((s: any) => ({ ...s, [key]: !s[key] }))} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${exportFields[key] ? 'bg-gradient-to-r from-[#9B5CFF] to-[#7C3AED] border-transparent text-white shadow' : 'bg-white border-gray-100 text-slate-700 hover:bg-gray-50'}`}>
                    <span className="w-5 h-5 inline-flex items-center justify-center">
                      {exportFields[key] ? <Check className="h-4 w-4 text-white" /> : <span className="w-4 h-4 border rounded-sm" />}
                    </span>
                    <span className="text-sm">{(
                      { name: 'Name', email: 'Email', phone: 'Phone', totalSpending: 'Total Spending', visitCount: 'Visits', lastVisit: 'Last Visit', status: 'Status' } as Record<string,string>
                    )[key]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">Estimated size</div>
                <div className="text-sm font-medium text-slate-800 mt-1">{formatBytes(new Blob([JSON.stringify({count: filteredCustomers.length, fields: Object.keys(exportFields).filter(k => exportFields[k]) })]).size)}</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setExportOpen(false)} className="px-4 py-2 rounded-full border text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200">Cancel</button>
                <button onClick={async () => {
                  setExportOpen(false)
                  try {
                    if (exportFormat === 'csv') exportCsv()
                    else if (exportFormat === 'excel') await exportExcel()
                    else if (exportFormat === 'pdf') await exportPdf()
                    else toast.show({ message: 'Export format not implemented' })
                  } catch (err) {
                    console.error('Export failed', err)
                    toast.show({ message: 'Export failed' })
                  }
                }} className="px-4 py-2 rounded-full bg-gradient-to-r from-[#9B5CFF] to-[#7C3AED] text-white text-sm shadow">Start Export</button>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  function FilterPopoverInner() {
    if (!filtersOpen) return null
    if (typeof document === 'undefined') return null
    const rect = filterRect
    const width = 320
    const style: React.CSSProperties = rect ? { position: 'fixed', top: rect.bottom + 10, left: Math.max(12, rect.right - width), width } : { position: 'fixed', right: 24, top: 120, width }

    return createPortal(
      <div style={style as any} className="z-[10002]">
        <div className="relative">
          <div className="absolute -top-2 right-6 w-3 h-3 transform rotate-45 bg-white border-t border-l border-gray-100" />
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 ring-1 ring-black/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Filters</div>
              <button onClick={() => { setFilterHasEmail(null); setFilterHasPhone(null); setFiltersOpen(false) }} className="text-sm text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-200 px-2 py-1 rounded">Reset</button>
            </div>

            <div className="mb-4">
              <div className="text-xs font-medium mb-2 text-slate-600">Has Email</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setFilterHasEmail(true); setFiltersOpen(false) }}
                  className={`text-sm px-3 py-2 rounded-full transition ${filterHasEmail === true ? 'bg-gradient-to-r from-[#9B5CFF] to-[#7C3AED] text-white shadow' : 'bg-white border border-gray-100 text-slate-700 hover:bg-gray-50'}`}
                >Yes</button>
                <button
                  onClick={() => { setFilterHasEmail(false); setFiltersOpen(false) }}
                  className={`text-sm px-3 py-2 rounded-full transition ${filterHasEmail === false ? 'bg-gradient-to-r from-[#9B5CFF] to-[#7C3AED] text-white shadow' : 'bg-white border border-gray-100 text-slate-700 hover:bg-gray-50'}`}
                >No</button>
                <button
                  onClick={() => { setFilterHasEmail(null); setFiltersOpen(false) }}
                  className={`text-sm px-3 py-2 rounded-full transition ${filterHasEmail === null ? 'bg-slate-50 border border-gray-100 text-slate-800 font-semibold' : 'bg-white border border-gray-100 text-slate-600 hover:bg-gray-50'}`}
                >Any</button>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium mb-2 text-slate-600">Has Phone</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setFilterHasPhone(true); setFiltersOpen(false) }}
                  className={`text-sm px-3 py-2 rounded-full transition ${filterHasPhone === true ? 'bg-gradient-to-r from-[#9B5CFF] to-[#7C3AED] text-white shadow' : 'bg-white border border-gray-100 text-slate-700 hover:bg-gray-50'}`}
                >Yes</button>
                <button
                  onClick={() => { setFilterHasPhone(false); setFiltersOpen(false) }}
                  className={`text-sm px-3 py-2 rounded-full transition ${filterHasPhone === false ? 'bg-gradient-to-r from-[#9B5CFF] to-[#7C3AED] text-white shadow' : 'bg-white border border-gray-100 text-slate-700 hover:bg-gray-50'}`}
                >No</button>
                <button
                  onClick={() => { setFilterHasPhone(null); setFiltersOpen(false) }}
                  className={`text-sm px-3 py-2 rounded-full transition ${filterHasPhone === null ? 'bg-slate-50 border border-gray-100 text-slate-800 font-semibold' : 'bg-white border border-gray-100 text-slate-600 hover:bg-gray-50'}`}
                >Any</button>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  // Delete confirmation modal rendered via portal
  function DeleteConfirmationModal() {
    if (!deleteTarget) return null
    if (typeof document === 'undefined') return null

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cancelDelete() }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }, [])

    return createPortal(
      <div className="fixed inset-0 z-[10002] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/30" onClick={cancelDelete} />
        <div className="relative z-[10003] w-full max-w-md bg-white rounded-xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold">Delete customer</h4>
              <p className="text-sm text-slate-600 mt-1">Are you sure you want to delete <span className="font-medium">{deleteTarget?.name}</span>? This action cannot be undone.</p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button onClick={cancelDelete} className="px-4 py-2 rounded-full border text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={confirmDelete} className="px-4 py-2 rounded-full bg-rose-600 text-white text-sm shadow">Delete</button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <div className="p-6 space-y-8 bg-background min-h-screen text-foreground">
      {/* Header */}
  <div className="flex flex-col gap-3 md:flex-row md:gap-0 md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Customers</h1>
          <p className="text-sm text-slate-500">Manage your customers</p>
        </div>
        <Button asChild className="rounded-md bg-slate-800 text-white px-4 py-2 shadow-sm hover:bg-slate-900">
          <Link href="/dashboard/customers/new">
            <Plus className="h-5 w-5 mr-2" />
            Add Customer
          </Link>
        </Button>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white rounded-lg shadow-sm p-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Total Customers</div>
              <div className="text-xl font-semibold text-slate-900">{customers.length}</div>
              <div className="text-xs text-slate-400">{customers.filter(c => c._count?.orders ?? 0).length} active</div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center shadow text-white font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11c1.657 0 3-1.343 3-3S17.657 5 16 5s-3 1.343-3 3 1.343 3 3 3zM8 21v-2a4 4 0 014-4h0a4 4 0 014 4v2" />
                </svg>
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-white rounded-lg shadow-sm p-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Total Revenue</div>
              <div className="text-xl font-semibold text-slate-900">${customers.reduce((s, c) => s + (c.totalSpending ?? 0), 0).toLocaleString()}</div>
              <div className="text-xs text-slate-400">across all customers</div>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-green-50 text-green-600 font-bold text-xl">$</div>
          </div>
        </Card>
        <Card className="bg-white rounded-lg shadow-sm p-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Average Spend</div>
              <div className="text-xl font-semibold text-slate-900">${(customers.length ? (customers.reduce((s, c) => s + (c.totalSpending ?? 0), 0) / customers.length) : 0).toFixed(2)}</div>
              <div className="text-xs text-slate-400">per customer</div>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 font-bold text-xl">↑</div>
          </div>
        </Card>
        <Card className="bg-white rounded-lg shadow-sm p-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Active Rate</div>
              <div className="text-xl font-semibold text-slate-900">{customers.length ? `${Math.round((customers.filter(c => (c.visitCount ?? 0) > 0).length / customers.length) * 100)}%` : '0%'}</div>
              <div className="text-xs text-slate-400">customer retention</div>
            </div>
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-bold text-xl">%</div>
          </div>
        </Card>
      </div>

      {/* Search + Directory merged into one card */}
      <Card className="bg-white rounded-lg shadow-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-100">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <Input
                  className="pl-9 h-10 rounded-lg bg-slate-50 border-slate-200 focus:border-blue-300 text-slate-700 font-medium text-sm"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="ml-auto flex gap-2 items-center">
                <div className="relative">
                  <button
                    ref={filterButtonRef}
                    onClick={() => {
                      const rect = filterButtonRef.current?.getBoundingClientRect() ?? null
                      setFilterRect(rect)
                      setFiltersOpen((s) => !s)
                    }}
                    className="group rounded-full border border-transparent px-3 py-1 text-sm font-semibold bg-white hover:bg-purple-50 hover:text-purple-600 transition-colors shadow-sm"
                    aria-expanded={filtersOpen}
                    aria-haspopup="menu"
                  >
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-600 group-hover:text-purple-600 transition-colors" />
                      <span>Filters</span>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setExportOpen(true)}
                  className="group rounded-full border border-transparent px-3 py-1 text-sm font-semibold bg-white hover:bg-purple-50 hover:text-purple-600 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Download className="h-4 w-4 text-slate-600 group-hover:text-purple-600 transition-colors" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          <div role="list" aria-label="Customer directory" className="p-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={`cust-skel-${i}`} className="flex items-center gap-3 p-3 bg-white rounded-md animate-pulse" aria-hidden>
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="flex-1">
                    <div className="h-3 bg-slate-200 rounded w-1/4 mb-2" />
                    <div className="h-2 bg-slate-200 rounded w-1/2" />
                  </div>
                  <div className="w-20">
                    <div className="h-3 bg-slate-200 rounded w-full" />
                  </div>
                </div>
              ))
            ) : filteredCustomers.length === 0 ? (
              <div className="py-12">
                <div className="max-w-xl mx-auto bg-white border border-gray-100 rounded-lg shadow-md p-8 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11c1.657 0 3-1.343 3-3S17.657 5 16 5s-3 1.343-3 3 1.343 3 3 3zM8 21v-2a4 4 0 014-4h0a4 4 0 014 4v2" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No customers yet</h3>
                  <p className="text-sm text-slate-500 mb-6">You don't have any customers in your database. Add customers to start tracking orders, visits, and conversations.</p>
                  <div className="flex items-center justify-center gap-3">
                    <Link href="/dashboard/customers/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 font-semibold">Add your first customer</Link>
                  
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        void (window.location.href = `/dashboard/customers/${c.id}`)
                      }
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(c.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-base text-slate-900">{c.name}</div>
                          <div className="text-xs text-slate-400 truncate flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                              <span className="truncate">{c.email ?? 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <PhoneIcon className="h-4 w-4 text-slate-400" />
                              <span className="truncate">{c.phone ?? 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold text-slate-800">${(c.totalSpending ?? 0).toFixed(2)}</div>
                          <div className="text-xs text-slate-400">{c.visitCount ?? 0} visits</div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-slate-400">Last visit: {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : '—'}</div>
                          <Badge variant="secondary">{(c.visitCount ?? 0) > 0 ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/customers/${c.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            aria-label={`View ${c.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/dashboard/customers/${c.id}/edit`}
                            title={`Edit ${c.name}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-200"
                          >
                            <span className="sr-only">Edit</span>
                            <Edit className="h-4 w-4 text-slate-700" aria-hidden />
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)} className="hover:bg-rose-100 rounded-full text-destructive" aria-label={`Delete ${c.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Export Modal rendered via portal (inner component has access to handlers) */}
            <CustomersPageModalInner />
            <FilterPopoverInner />
            <DeleteConfirmationModal />

            {totalPages > page && (
              <div className="text-center mt-4">
                <Button
                  onClick={async () => {
                    setLoadingMore(true)
                    try {
                      setPage((p) => p + 1)
                    } finally {
                      setLoadingMore(false)
                    }
                  }}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 px-6 py-2 shadow"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// (modal removed; using inner component which closes over state)
