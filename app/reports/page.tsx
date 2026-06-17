'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Printer } from 'lucide-react';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import type { Building } from '@/lib/types';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

interface ReportRow {
  id: number;
  full_name: string;
  room_number: string;
  monthly_fee: number;
  phone_number: string;
  paid_amount: number;
  status: 'paid' | 'unpaid' | 'partial';
  mpesa_reference: string | null;
  paid_at: string | null;
  method: string | null;
}

interface Summary {
  total_expected: number;
  total_collected: number;
  outstanding: number;
  num_paid: number;
  num_unpaid: number;
}

export default function ReportsPage() {
  const now = new Date();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingId, setBuildingId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    fetch('/api/buildings').then((r) => r.json()).then(setBuildings);
  }, []);

  const loadReport = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setFetched(false);
    const res = await fetch(
      `/api/reports?building_id=${buildingId}&month=${month}&year=${year}`
    );
    const data = await res.json();
    setRows(data.rows ?? []);
    setSummary(data.summary ?? null);
    setLoading(false);
    setFetched(true);
  }, [buildingId, month, year]);

  const handlePrint = () => window.print();

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const selectedBuilding = buildings.find((b) => String(b.id) === buildingId);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-500">Per-building monthly collection report</p>
        </div>
        {fetched && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors print:hidden"
          >
            <Printer className="h-4 w-4" /> Print / Export
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6 print:hidden">
        <select
          value={buildingId}
          onChange={(e) => setBuildingId(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select building…</option>
          {buildings.map((b) => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
        </select>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button
          onClick={loadReport}
          disabled={!buildingId || loading}
          className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm rounded-lg disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Generate Report'}
        </button>
      </div>

      {fetched && summary && (
        <>
          {/* Print header */}
          <div className="hidden print:block mb-6">
            <h2 className="text-xl font-bold">
              {selectedBuilding?.name} — {MONTH_NAMES[month - 1]} {year}
            </h2>
            <p className="text-sm text-gray-500">{selectedBuilding?.location}</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatCard label="Expected" value={`KES ${Number(summary.total_expected).toLocaleString()}`} />
            <StatCard label="Collected" value={`KES ${Number(summary.total_collected).toLocaleString()}`} />
            <StatCard label="Outstanding" value={`KES ${Number(summary.outstanding).toLocaleString()}`} />
            <StatCard label="Paid" value={summary.num_paid} />
            <StatCard label="Unpaid" value={summary.num_unpaid} />
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Room</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-right">Fee</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">M-Pesa Ref</th>
                  <th className="px-4 py-3 text-left">Date Paid</th>
                  <th className="px-4 py-3 text-left">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 font-medium">{r.room_number}</td>
                    <td className="px-4 py-3 text-gray-800">{r.full_name}</td>
                    <td className="px-4 py-3 text-right text-gray-700">KES {Number(r.monthly_fee).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {Number(r.paid_amount) > 0 ? `KES ${Number(r.paid_amount).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.mpesa_reference ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {r.paid_at ? new Date(r.paid_at).toLocaleString('en-KE') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs capitalize">
                      {r.method?.replace('_', ' ') ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!fetched && !loading && (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Select a building and month, then click Generate Report.</p>
        </div>
      )}
    </div>
  );
}
