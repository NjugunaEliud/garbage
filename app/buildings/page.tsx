'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Building2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import type { Building } from '@/lib/types';

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState({ name: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/buildings');
    setBuildings(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', location: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (b: Building) => {
    setEditing(b);
    setForm({ name: b.name, location: b.location });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this building? All customers inside will also be deleted.')) return;
    await fetch(`/api/buildings/${id}`, { method: 'DELETE' });
    load();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const url = editing ? `/api/buildings/${editing.id}` : '/api/buildings';
    const method = editing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Failed to save');
      setSaving(false);
      return;
    }

    setSaving(false);
    setShowModal(false);
    load();
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Buildings</h1>
          <p className="text-sm text-gray-400">{buildings.length} building(s) registered</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Building
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : buildings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No buildings yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {buildings.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800 text-lg">{b.name}</p>
                  <p className="text-sm text-gray-500">{b.location}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(b)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Link
                href={`/customers?building_id=${b.id}`}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 font-medium"
              >
                View customers <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          title={editing ? 'Edit Building' : 'Add Building'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50 focus:bg-white transition"
                placeholder="e.g. Sunrise Apartments"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-gray-50 focus:bg-white transition"
                placeholder="e.g. Nairobi, Westlands"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm rounded-xl disabled:opacity-60"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Building'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
