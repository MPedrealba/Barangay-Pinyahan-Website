'use client';
import { useState, useEffect } from 'react';

const RULE_OPTIONS = [
  { value: 'MANDATORY', label: 'Mandatory', desc: 'Accused name is required', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'OPTIONAL',  label: 'Optional',  desc: 'Accused name is optional', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'HIDDEN',    label: 'Hidden',    desc: 'Accused name is not shown', color: 'bg-gray-100 text-gray-600 border-gray-200' },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newRule, setNewRule] = useState('OPTIONAL');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRule, setEditRule] = useState('');

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) { setError('Category name is required.'); return; }
    setCreating(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newName.trim(), accused_rule: newRule })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create.'); return; }
      setNewName('');
      setNewRule('OPTIONAL');
      fetchCategories();
    } catch (err) {
      setError('Network error.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCategories();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleUpdate = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: editName, accused_rule: editRule })
      });
      if (res.ok) {
        setEditingId(null);
        fetchCategories();
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditRule(cat.accused_rule);
  };

  const getRuleBadge = (rule) => {
    const opt = RULE_OPTIONS.find(o => o.value === rule) || RULE_OPTIONS[1];
    return <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${opt.color}`}>{opt.label}</span>;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-black text-[#002B5B] flex items-center gap-2 uppercase tracking-wide">
          <i className="fas fa-tags text-[#0056b3]"></i> Complaint Categories
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage dynamic complaint types and accused name rules</p>
      </div>

      {/* Add New Category */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide mb-4 flex items-center gap-2">
          <i className="fas fa-plus-circle text-[#0056b3]"></i> Add New Category
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Category name"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError(''); }}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <select
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 font-semibold min-w-[160px]"
          >
            {RULE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label} — {o.desc}</option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="bg-[#0056b3] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-800 transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            <i className={`fas ${creating ? 'fa-spinner fa-spin' : 'fa-plus'}`}></i>
            {creating ? 'Adding...' : 'Add Category'}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600 font-semibold mt-2 flex items-center gap-1">
            <i className="fas fa-exclamation-circle"></i> {error}
          </p>
        )}
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-bold">Category Name</th>
              <th className="px-6 py-4 font-bold">Accused Name Rule</th>
              <th className="px-6 py-4 font-bold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-400 text-sm">Loading...</td></tr>
            ) : categories.length > 0 ? (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors text-sm text-gray-700">
                  <td className="px-6 py-4">
                    {editingId === cat.id ? (
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    ) : (
                      <span className="font-bold text-gray-900">{cat.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === cat.id ? (
                      <select value={editRule} onChange={e => setEditRule(e.target.value)}
                        className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 font-semibold">
                        {RULE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      getRuleBadge(cat.accused_rule)
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingId === cat.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleUpdate(cat.id)}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 transition-colors">
                          <i className="fas fa-check mr-1"></i> Save
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="text-gray-500 hover:text-gray-700 text-xs font-bold px-2">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => startEdit(cat)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-bold px-2 py-1">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button onClick={() => handleDelete(cat.id, cat.name)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-500 font-medium">No categories found. Add one above.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-gray-50 rounded-xl border border-gray-100 p-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Accused Name Rules Legend</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {RULE_OPTIONS.map(o => (
            <div key={o.value} className="flex items-start gap-2">
              {getRuleBadge(o.value)}
              <span className="text-xs text-gray-500 mt-0.5">{o.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
