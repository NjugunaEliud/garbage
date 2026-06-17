'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, CreditCard, Smartphone } from 'lucide-react';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import type { Building, Customer, Payment } from '@/lib/types';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function PaymentsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [buildingFilter, setBuildingFilter] = useState('');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // STK Push modal
  const [stkCustomer, setStkCustomer] = useState<Customer | null>(null);
  const [stkPushing, setStkPushing] = useState(false);
  const [stkMsg, setStkMsg] = useState('');

  // Manual reference modal
  const [manualCustomer, setManualCustomer] = useState<Customer | null>(null);
  const [manualForm, setManualForm] = useState({ mpesa_reference: '', amount: '', phone_number: '' });
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    const qs = buildingFilter ? `&building_id=${buildingFilter}` : '';
    const [cRes, bRes, pRes] = await Promise.all([
      fetch(`/api/customers${buildingFilter ? `?building_id=${buildingFilter}` : ''}`),
      fetch('/api/buildings'),
      fetch(`/api/payments?month=${month}&year=${year}${qs}`),
    ]);
    setCustomers(await cRes.json());
    setBuildings(await bRes.json());
    setPayments(await pRes.json());
    setLoading(false);
  }, [month, year, buildingFilter]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const getPayment = (customerId: number) =>
    payments.find((p) => p.customer_id === customerId);

  // STK Push
  const handleStkPush = async () => {
    if (!stkCustomer) return;
    setStkPushing(true);
    setStkMsg('');
    const res = await fetch('/api/mpesa/stk-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: stkCustomer.id, month, year }),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      setStkMsg(data.error ?? `STK Push failed (${res.status})`);
    } else {
      setStkMsg('STK Push sent! Waiting for customer to enter PIN…');
      setTimeout(() => { setStkCustomer(null); setStkMsg(''); loadAll(); }, 3000);
    }
    setStkPushing(false);
  };

  // Manual reference
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCustomer) return;
    setManualSaving(true);
    setManualError('');

    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: manualCustomer.id,
        month,
        year,
        amount: Number(manualForm.amount) || manualCustomer.monthly_fee,
        method: 'manual_reference',
        mpesa_reference: manualForm.mpesa_reference.toUpperCase(),
        phone_number: manualForm.phone_number || manualCustomer.phone_number,
        status: 'paid',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setManualError(data.error ?? `Failed to record payment (${res.status})`);
      setManualSaving(false);
      return;
    }
    setManualSaving(false);
    setManualCustomer(null);
    loadAll();
  };

  const openManual = (c: Customer) => {
    const existing = getPayment(c.id);
    setManualForm({
      mpesa_reference: existing?.mpesa_reference ?? '',
      amount: String(existing?.amount ?? c.monthly_fee),
      phone_number: existing?.phone_number ?? c.phone_number,
    });
    setManualError('');
    setManualCustomer(c);
  };

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payments</h1>
          <p className="text-sm text-gray-400">Manage monthly garbage fee payments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50"
        >
          <option value="">All Buildings</option>
          {buildings.map((b) => (
            <option key={b.id} value={String(b.id)}>{b.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No customers found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Building / Room</th>
                <th className="px-4 py-3 text-right">Fee</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-left">Ref</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c) => {
                const pmt = getPayment(c.id);
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.building_name} / {c.room_number}</td>
                    <td className="px-4 py-3 text-right text-gray-700">KES {Number(c.monthly_fee).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {pmt ? `KES ${Number(pmt.amount).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {pmt?.mpesa_reference ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={pmt?.status ?? 'unpaid'} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs capitalize">
                      {pmt?.method?.replace('_', ' ') ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setStkCustomer(c)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-100 text-green-800 hover:bg-green-200 rounded-md text-xs font-medium transition-colors"
                          title="Request STK Push"
                        >
                          <Smartphone className="h-3.5 w-3.5" /> STK
                        </button>
                        <button
                          onClick={() => openManual(c)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md text-xs font-medium transition-colors"
                          title="Enter M-Pesa reference"
                        >
                          <Plus className="h-3.5 w-3.5" /> Ref
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* STK Push Modal */}
      {stkCustomer && (
        <Modal title="Request STK Push" onClose={() => { setStkCustomer(null); setStkMsg(''); }}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-700">
              Send M-Pesa payment request to <strong>{stkCustomer.full_name}</strong>
              &nbsp;({stkCustomer.phone_number}) for{' '}
              <strong>KES {Number(stkCustomer.monthly_fee).toLocaleString()}</strong> —{' '}
              {MONTH_NAMES[month - 1]} {year}.
            </p>
            {stkMsg && (
              <p className={`text-sm ${stkMsg.includes('failed') || stkMsg.includes('error') ? 'text-red-500' : 'text-green-600'}`}>
                {stkMsg}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setStkCustomer(null); setStkMsg(''); }} className="px-4 py-2 text-sm text-gray-600">
                Cancel
              </button>
              <button
                onClick={handleStkPush}
                disabled={stkPushing}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm rounded-xl disabled:opacity-60"
              >
                {stkPushing ? 'Sending…' : 'Send STK Push'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Reference Modal */}
      {manualCustomer && (
        <Modal
          title="Enter M-Pesa Reference"
          onClose={() => setManualCustomer(null)}
        >
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
            {manualError && <p className="text-sm text-red-500">{manualError}</p>}
            <p className="text-sm text-gray-600">
              Recording payment for <strong>{manualCustomer.full_name}</strong> —{' '}
              {MONTH_NAMES[month - 1]} {year}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Reference Code</label>
              <input
                type="text" required value={manualForm.mpesa_reference}
                onChange={(e) => setManualForm({ ...manualForm, mpesa_reference: e.target.value.toUpperCase() })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50 focus:bg-white transition"
                placeholder="e.g. QK7BX3RT2"
                maxLength={12}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                <input
                  type="number" required min={1} value={manualForm.amount}
                  onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel" required value={manualForm.phone_number}
                  onChange={(e) => setManualForm({ ...manualForm, phone_number: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setManualCustomer(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800">
                Cancel
              </button>
              <button
                type="submit" disabled={manualSaving}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm rounded-xl disabled:opacity-60"
              >
                {manualSaving ? 'Saving…' : 'Record Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
