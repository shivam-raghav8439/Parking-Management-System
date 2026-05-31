import React, { useState, useEffect } from 'react';
import { parkingApi } from '../../api/parkingApi';
import toast from 'react-hot-toast';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit, 
  Wrench, 
  CheckCircle, 
  Search, 
  X, 
  Check, 
  Loader, 
  AlertTriangle,
  Info,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function SlotManagement() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal / Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);
  
  const [formData, setFormData] = useState({
    zone: 'A',
    number: '',
    status: 'available',
    price: ''
  });

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const list = await parkingApi.getSlots();
      setSlots(list || []);
    } catch (err) {
      toast.error('Failed to load slots database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ zone: 'A', number: '', status: 'available', price: '' });
    setIsEditing(false);
    setShowAddForm(true);
  };

  const handleOpenEdit = (slot) => {
    setFormData({
      zone: slot.zone || slot.zoneId || 'A',
      number: slot.number || '',
      status: slot.status || 'available',
      price: slot.price || ''
    });
    setEditingSlotId(slot.slotNumber);
    setIsEditing(true);
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.number) {
      toast.error('Please enter a slot number.');
      return;
    }

    const payload = {
      slotNumber: `${formData.zone}-${formData.number}`,
      zone: formData.zone,
      number: parseInt(formData.number),
      status: formData.status,
      price: formData.price ? parseFloat(formData.price) : null
    };

    try {
      if (isEditing) {
        const res = await parkingApi.updateSlot(editingSlotId, payload);
        if (res && res.success) {
          toast.success('Slot configuration updated successfully.');
          setShowAddForm(false);
          fetchSlots();
        }
      } else {
        const res = await parkingApi.createSlot(payload);
        if (res && res.success) {
          toast.success(`Slot ${payload.slotNumber} created successfully.`);
          setShowAddForm(false);
          fetchSlots();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred while saving slot.');
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm(`Are you sure you want to delete slot ${id}?`)) {
      return;
    }
    try {
      const res = await parkingApi.deleteSlot(id);
      if (res && res.success) {
        toast.success(`Slot ${id} deleted successfully.`);
        fetchSlots();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete slot.');
    }
  };

  const handleToggleMaintenance = async (slot) => {
    const nextStatus = slot.status === 'maintenance' ? 'available' : 'maintenance';
    try {
      const res = await parkingApi.updateSlot(slot.slotNumber, { status: nextStatus });
      if (res && res.success) {
        toast.success(`Slot ${slot.slotNumber} is now ${nextStatus === 'maintenance' ? 'under maintenance' : 'available'}.`);
        fetchSlots();
      }
    } catch (err) {
      toast.error('Failed to update slot status.');
    }
  };

  // Filter slots
  const filteredSlots = slots.filter(s => {
    const sId = (s.slotNumber || '').toLowerCase();
    const sZone = (s.zone || s.zoneId || '').toUpperCase();
    const sStat = (s.status || '').toLowerCase();

    const matchesSearch = sId.includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === 'All' || sZone === selectedZone.toUpperCase();
    const matchesStatus = selectedStatus === 'All' || sStat === selectedStatus.toLowerCase();

    return matchesSearch && matchesZone && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Parking Slots Configuration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
            Configure slots dynamically, set maintenance flags, and override pricing.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-primary-750 hover:bg-primary-850 active:bg-primary-900 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Parking Slot
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filters Panel */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md h-fit space-y-5">
          <h3 className="text-xs font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            Filters & Search
          </h3>

          {/* Search slot */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider">Search Code</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="e.g. A-12..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Zone filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider">Filter Zone</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:bg-slate-950 text-slate-950 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="All">All Zones</option>
              <option value="A">Zone A (Cars Only)</option>
              <option value="B">Zone B (Bikes Only)</option>
              <option value="C">Zone C (Faculty Only)</option>
              <option value="D">Zone D (Visitors/Buses)</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider">Filter Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:bg-slate-950 text-slate-950 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="booked">Booked (Reserved)</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
            <span>Result Count:</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-200">{filteredSlots.length} slots</span>
          </div>
        </div>

        {/* Slot Grid Panel */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader className="w-8 h-8 text-primary-600 animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-mono">Loading slots layout...</p>
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center gap-3 shadow-md">
              <AlertTriangle className="w-10 h-10 text-slate-400 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No matching slots configured.</p>
              <p className="text-xs text-slate-450 dark:text-slate-550 text-center max-w-xs font-semibold">Change filters or add a new slot to system.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSlots.map((slot) => {
                const sStatus = slot.status || 'available';
                const zoneCode = slot.zone || slot.zoneId || 'A';
                return (
                  <div 
                    key={slot.slotNumber} 
                    className="glass-panel p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-lg transition-all"
                  >
                    {/* Status Badge Line */}
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-black text-slate-800 dark:text-white font-mono tracking-tight">{slot.slotNumber}</span>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        sStatus === 'available'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20'
                          : sStatus === 'occupied'
                          ? 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/20'
                          : sStatus === 'booked' || sStatus === 'reserved'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/20'
                          : 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/20'
                      }`}>
                        {sStatus}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider">Zone {zoneCode}</p>
                      {slot.price ? (
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                          <span>₹{slot.price}/hr (override)</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 dark:text-slate-550 font-medium">Standard rate pricing</p>
                      )}
                    </div>

                    {/* Quick controls */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggleMaintenance(slot)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          sStatus === 'maintenance'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-amber-500 dark:bg-slate-800/40 dark:border-slate-800'
                        }`}
                        title={sStatus === 'maintenance' ? 'Set Active' : 'Set Under Maintenance'}
                        disabled={sStatus === 'occupied'}
                      >
                        {sStatus === 'maintenance' ? <CheckCircle className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenEdit(slot)}
                          className="p-1.5 bg-slate-50 text-slate-500 border border-slate-200 hover:text-primary-650 rounded-lg transition-all cursor-pointer dark:bg-slate-800/40 dark:border-slate-800"
                          title="Edit Price/Details"
                          disabled={sStatus === 'occupied'}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.slotNumber)}
                          className="p-1.5 bg-slate-50 text-slate-500 border border-slate-200 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/30 rounded-lg transition-all cursor-pointer dark:bg-slate-800/40 dark:border-slate-800"
                          title="Delete Slot"
                          disabled={sStatus === 'occupied'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Form Drawer Modal Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl relative animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isEditing ? `Configure Slot ${editingSlotId}` : 'Add New Parking Slot'}
              </h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-550 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Zone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">Zone Preference</label>
                <select
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  disabled={isEditing}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="A" className="text-slate-900 bg-white dark:bg-slate-900">Zone A (Cars Only)</option>
                  <option value="B" className="text-slate-900 bg-white dark:bg-slate-900">Zone B (Bikes Only)</option>
                  <option value="C" className="text-slate-900 bg-white dark:bg-slate-900">Zone C (Faculty Only)</option>
                  <option value="D" className="text-slate-900 bg-white dark:bg-slate-900">Zone D (Visitors/Buses)</option>
                </select>
              </div>

              {/* Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">Slot Number ID</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 25"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  disabled={isEditing}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-905 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="available" className="text-slate-900 bg-white dark:bg-slate-900">Available</option>
                  <option value="maintenance" className="text-slate-900 bg-white dark:bg-slate-900">Maintenance Flag</option>
                </select>
              </div>

              {/* Price Override */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-405 uppercase tracking-wider block">Price Override (₹/hr) (Optional)</label>
                <input
                  type="number"
                  placeholder="Leave empty for standard rates"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">Standard rates apply dynamically if override is blank.</p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-55 text-slate-550 dark:text-slate-350 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-750 hover:bg-primary-850 active:bg-primary-900 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
