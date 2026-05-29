import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { parkingApi } from '../api/parkingApi';
import { DEFAULT_SETTINGS, DEFAULT_ZONES } from '../utils/constants';
import toast from 'react-hot-toast';
import { Save, Settings2, Sliders, Shield, Info, HelpCircle } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const [collegeName, setCollegeName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [enableReserved, setEnableReserved] = useState(true);
  const [reservedCount, setReservedCount] = useState(5);
  
  // Rate limits
  const [rateCar, setRateCar] = useState(20);
  const [rateBike, setRateBike] = useState(10);
  const [rateBicycle, setRateBicycle] = useState(5);
  const [rateBus, setRateBus] = useState(50);

  // Zone capacities
  const [capA, setCapA] = useState(40);
  const [capB, setCapB] = useState(50);
  const [capC, setCapC] = useState(20);
  const [capD, setCapD] = useState(30);

  const [loading, setLoading] = useState(true);

  // Theme support
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('dashboard_theme') || 'classic';
  });

  const changeTheme = (themeName) => {
    setCurrentTheme(themeName);
    localStorage.setItem('dashboard_theme', themeName);
    window.dispatchEvent(new Event('themeChange'));
    toast.success(`Theme updated to ${themeName.charAt(0).toUpperCase() + themeName.slice(1)}!`);
  };

  const themesList = [
    { id: 'classic', name: 'Ocean Tech (Blue)', previewColor: 'bg-blue-500 border-blue-600' },
    { id: 'galgotias', name: 'Galgotias (Purple)', previewColor: 'bg-indigo-500 border-indigo-700' },
    { id: 'emerald', name: 'Emerald Forest', previewColor: 'bg-emerald-500 border-emerald-600' },
    { id: 'sunset', name: 'Sunset Crimson', previewColor: 'bg-rose-500 border-rose-600' },
    { id: 'amber', name: 'Cyber Amber', previewColor: 'bg-amber-500 border-amber-600' },
  ];

  // Query Settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await parkingApi.getSettings();
        if (data) {
          setCollegeName(data.collegeName || 'State Institute of Technology');
          setContactNumber(data.contactNumber || '+91 98765 43210');
          setEnableReserved(data.enableReserved ?? true);
          setReservedCount(data.reservedCount ?? 5);
          
          if (data.rates) {
            setRateCar(data.rates.Car ?? 20);
            setRateBike(data.rates.Bike ?? 10);
            setRateBicycle(data.rates.Bicycle ?? 5);
            setRateBus(data.rates.Bus ?? 50);
          }

          // Fetch capacities
          setCapA(parseInt(data.capacity_A) || 40);
          setCapB(parseInt(data.capacity_B) || 50);
          setCapC(parseInt(data.capacity_C) || 20);
          setCapD(parseInt(data.capacity_D) || 30);
        }
      } catch (err) {
        toast.error('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Update Settings mutation
  const settingsMutation = useMutation({
    mutationFn: parkingApi.updateSettings,
    onSuccess: () => {
      // Invalidate relevant queries to force re-render slots/stats
      queryClient.invalidateQueries({ queryKey: ['parking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['parking-slots'] });
      
      toast.success('Configuration saved successfully!');
      
      // Dispatch custom event to let navbar know college name changed immediately
      window.dispatchEvent(new Event('settingsUpdated'));
    },
    onError: () => {
      toast.error('Failed to update settings.');
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    settingsMutation.mutate({
      collegeName,
      contactNumber,
      enableReserved,
      reservedCount: parseInt(reservedCount),
      rates: {
        Car: parseInt(rateCar),
        Bike: parseInt(rateBike),
        Bicycle: parseInt(rateBicycle),
        Bus: parseInt(rateBus)
      },
      capacity_A: parseInt(capA),
      capacity_B: parseInt(capB),
      capacity_C: parseInt(capC),
      capacity_D: parseInt(capD)
    });
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-450 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary-600"></div>
        <span>Retrieving system preferences...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
          Control Panel Settings
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure parking fee policies, capacity parameters, and profile details.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Section 1: College metadata */}
          <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/50 text-slate-800 dark:text-white">
              <Settings2 className="w-5 h-5 text-primary-500" />
              <h3 className="font-bold">General Settings</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">College Name</label>
                <input
                  type="text"
                  required
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Contact / Support Helpline</label>
                <input
                  type="text"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing rates */}
          <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/50 text-slate-800 dark:text-white">
              <Sliders className="w-5 h-5 text-primary-500" />
              <h3 className="font-bold">Parking Rate Structure</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Car Rate (₹ / hr)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={rateCar}
                  onChange={(e) => setRateCar(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-855 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Bike Rate (₹ / hr)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={rateBike}
                  onChange={(e) => setRateBike(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-855 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Bicycle Rate (₹ / hr)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={rateBicycle}
                  onChange={(e) => setRateBicycle(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-855 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Bus Rate (₹ / hr)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={rateBus}
                  onChange={(e) => setRateBus(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-855 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Zone Capacity configs */}
          <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/50 text-slate-800 dark:text-white">
              <Sliders className="w-5 h-5 text-primary-500" />
              <h3 className="font-bold">Zone Capacities (Max Slots)</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Zone A Capacity</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={capA}
                  onChange={(e) => setCapA(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-855 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Zone B Capacity</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={capB}
                  onChange={(e) => setCapB(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-855 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Zone C Capacity</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={capC}
                  onChange={(e) => setCapC(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-855 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Zone D Capacity</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="1000"
                  value={capD}
                  onChange={(e) => setCapD(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-855 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal flex items-start gap-1">
              <Info className="w-3.5 h-3.5 text-slate-450 inline shrink-0 mt-0.5" />
              Adjusting capacities will automatically rebuild slots and realign active vehicle parking assignments.
            </p>
          </div>

          {/* Section 4: Reserved slot settings */}
          <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/50 text-slate-800 dark:text-white">
              <Shield className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold">Reserved Spaces Settings</h3>
            </div>

            <div className="space-y-5">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableReserved}
                  onChange={(e) => setEnableReserved(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-slate-300 text-primary-600 focus:ring-primary-500 outline-none cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-850 dark:text-white">Enable Reserved Parking Slots</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Hold specialized spaces at the front of each zone</p>
                </div>
              </label>

              {enableReserved && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-bold text-slate-500 uppercase">Reserved Count (Slots per zone)</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={reservedCount}
                    onChange={(e) => setReservedCount(e.target.value)}
                    className="w-full max-w-xs px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                    The first {reservedCount} slots of each zone (e.g. A-1 to A-{reservedCount}) will be flagged as RESERVED.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Dashboard Color Theme */}
          <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/50 text-slate-800 dark:text-white">
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500"></span>
              <h3 className="font-bold">Dashboard Color Theme</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {themesList.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => changeTheme(theme.id)}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all cursor-pointer ${
                    currentTheme === theme.id
                      ? 'border-primary-500 bg-primary-50/10 ring-2 ring-primary-500/25'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full border-2 ${theme.previewColor} shadow-md shrink-0 flex items-center justify-center`}>
                    {currentTheme === theme.id && (
                      <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
                    )}
                  </span>
                  <span className="text-xs font-semibold text-center text-slate-800 dark:text-slate-200">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={settingsMutation.isLoading}
            className="px-6 py-3 bg-primary-700 hover:bg-primary-850 active:bg-primary-900 text-white font-bold rounded-xl text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {settingsMutation.isLoading ? 'Saving changes...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
