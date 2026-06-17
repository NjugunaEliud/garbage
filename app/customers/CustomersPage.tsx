'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import type { Building, Customer, Payment } from '@/lib/types';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const filterBuilding = searchParams.get('building_id') ?? '';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [buildingFilter, setBuildingFilter] = useState(filterBuilding);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    full_name: '', phone_number: '', building_id: '', room_number: '', monthly_fee: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const loadAll = useCallback(async () => {
    setLoading(true);
    const qs = buildingFilter ? `?building_id=${buildingFilter}` : '';
    const [cRes, bRes, pRes] = await Promise.all([
      fetch(`/api/customers${qs}`),
      fetch('/api/buildings'),
      fetch(`/api/payments?month=${currentMonth}&year=${currentYear}`),
    ]);
    setCustomers(await cRes.json());
    setBuildings(await bRes.json());
    setPayments(await pRes.json());
    setLoading(false);
  }, [buildingFilter, currentMonth, currentYear]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const getStatus = (customerId: number) => {
    const p = payments.find((pay) => pay.customer_id === customerId);
    return p?.status ?? 'unpaid';
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ full_name: '', phone_number: '', building_id: buildingFilter, room_number: '', monthly_fee: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      full_name: c.full_name,
      phone_number: c.phone_number,
      building_id: String(c.building_id),
      room_number: c.room_number,
      monthly_fee: String(c.monthly_fee),
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this customer? All their payment records will be removed.')) return;
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    loadAll();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const url = editing ? `/api/customers/${editing.id}` : '/api/customers';
    const method = editing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        building_id: Number(form.building_id),
        monthly_fee: Number(form.monthly_fee),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Failed to save');
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowModal(false);
    loadAll();
  };

  const filteredCustomers = buildingFilter
    ? customers.filter((c) => String(c.building_id) === buildingFilter)
    : customers;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
          <p className="text-sm text-gray-400">
            {filteredCustomers.length} customer(s) — {MONTH_NAMES[currentMonth - 1]} {currentYear} status
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
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
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No customers found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Building</th>
                <th className="px-4 py-3 text-left">Room</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-right">Monthly Fee</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.building_name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.room_number}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone_number}</td>
                  <td className="px-4 py-3 text-right text-gray-700">KES {Number(c.monthly_fee).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={getStatus(c.id)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal
          title={editing ? 'Edit Customer' : 'Add Customer'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <p className="text-sm text-red-500">{error}</p>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text" required value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50 focus:bg-white transition"
                placeholder="e.g. Jane Wanjiku"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel" required value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50 focus:bg-white transition"
                placeholder="07XXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
              <select
                required value={form.building_id}
                onChange={(e) => setForm({ ...form, building_id: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50 focus:bg-white transition"
              >
                <option value="">Select building…</option>
                {buildings.map((b) => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                <input
                  type="text" required value={form.room_number}
                  onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50 focus:bg-white transition"
                  placeholder="e.g. A3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee (KES)</label>
                <input
                  type="number" required min={0} value={form.monthly_fee}
                  onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50 focus:bg-white transition"
                  placeholder="500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800">
                Cancel
              </button>
              <button
                type="submit" disabled={saving}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm rounded-xl disabled:opacity-60"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Customer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
