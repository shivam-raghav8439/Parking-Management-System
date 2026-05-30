import React from 'react';
import { 
  useParkingStats, 
  useParkingActivity 
} from '../hooks/useParkingData';
import StatCard from '../components/StatCard';
import { CardSkeleton, TableSkeleton } from '../components/Loader';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Layers, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  ArrowDownLeft, 
  ArrowUpRight,
  TrendingUp,
  Camera
} from 'lucide-react';
import { formatRelativeTime } from '../utils/formatTime';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useParkingStats();
  const { data: activity, isLoading: activityLoading } = useParkingActivity();

  // Hourly traffic mock/derived data for the Recharts BarChart
  // Show vehicle entry/exit patterns
  const hourlyTrafficData = [
    { hour: '08:00 AM', Entries: 12, Exits: 3 },
    { hour: '10:00 AM', Entries: 28, Exits: 14 },
    { hour: '12:00 PM', Entries: 18, Exits: 22 },
    { hour: '02:00 PM', Entries: 15, Exits: 19 },
    { hour: '04:00 PM', Entries: 25, Exits: 11 },
    { hour: '06:00 PM', Entries: 8, Exits: 27 },
  ];

  if (statsLoading || activityLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-2xl h-80 bg-white dark:bg-slate-900 animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl h-80 bg-white dark:bg-slate-900 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Parking Telemetry Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time status overview and operational control.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Slots"
          value={stats?.totalSlots ?? 140}
          icon={Layers}
          color="indigo"
          description="Consolidated capacity of all zones"
        />
        <StatCard
          title="Available Slots"
          value={stats?.availableSlots ?? 0}
          icon={CheckCircle}
          color="emerald"
          description="Empty parking spaces remaining"
        />
        <StatCard
          title="Occupied Slots"
          value={stats?.occupiedSlots ?? 0}
          icon={XCircle}
          color="rose"
          description="Currently parked vehicles"
        />
        <StatCard
          title="Today Revenue"
          value={`₹${stats?.todayRevenue ?? 0}`}
          icon={DollarSign}
          color="amber"
          trend="+18.4%"
          trendType="up"
          description="Settled parking fees collected today"
        />
        <StatCard
          title="ANPR Today"
          value={stats?.anprToday ?? 0}
          icon={Camera}
          color="violet"
          description="Vehicles auto-entered via gate camera"
        />
      </div>

      {/* Middle Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts Hourly Traffic Bar Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Hourly Traffic Analysis</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Vehicles entered vs checked-out during peak hours</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500">
              <TrendingUp className="w-5 h-5 text-primary-500" />
            </div>
          </div>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="105%">
              <BarChart data={hourlyTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="hour" tickLine={false} stroke="rgba(148, 163, 184, 0.5)" />
                <YAxis tickLine={false} stroke="rgba(148, 163, 184, 0.5)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                    borderColor: 'rgba(71, 85, 105, 0.5)',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="Entries" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Exits" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Occupancy Progress Cards */}
        <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Zone Occupancy Rates</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Space utilization sorted by parking zones</p>
          </div>

          <div className="space-y-5">
            {[
              { id: 'A', name: 'Zone A (Cars)', pct: stats?.zoneOccupancy?.A ?? 30, color: 'bg-blue-600', text: 'text-blue-500' },
              { id: 'B', name: 'Zone B (Bikes)', pct: stats?.zoneOccupancy?.B ?? 15, color: 'bg-violet-600', text: 'text-violet-500' },
              { id: 'C', name: 'Zone C (Faculty)', pct: stats?.zoneOccupancy?.C ?? 40, color: 'bg-fuchsia-600', text: 'text-fuchsia-500' },
              { id: 'D', name: 'Zone D (Visitors)', pct: stats?.zoneOccupancy?.D ?? 25, color: 'bg-orange-600', text: 'text-orange-500' }
            ].map((zone) => (
              <div key={zone.id} className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-350">{zone.name}</span>
                  <span className={zone.text}>{zone.pct}% Filled</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${zone.color}`} 
                    style={{ width: `${zone.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center uppercase tracking-wider font-semibold">
            Status Updated Just Now
          </div>
        </div>

      </div>

      {/* Recent Activity Feed */}
      <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
        <h3 className="font-bold text-slate-900 dark:text-white mb-1">Live Activity Stream</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Latest 10 logs of incoming and outgoing vehicles</p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3">Action</th>
                <th className="pb-3">License Plate</th>
                <th className="pb-3">Allocated Slot</th>
                <th className="pb-3 text-right">Event Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {activity && activity.length > 0 ? (
                activity.map((event) => {
                  const isEntry = event.type === 'entry';
                  return (
                    <tr key={event.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 flex items-center gap-2">
                        {isEntry ? (
                          <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg inline-flex">
                            <ArrowDownLeft className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg inline-flex">
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        )}
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          {isEntry ? 'Check In' : 'Check Out'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="license-plate-small">{event.plate}</span>
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-600 dark:text-slate-450">
                        {event.slotNumber}
                      </td>
                      <td className="py-3 text-right text-slate-400 dark:text-slate-500 font-mono text-xs">
                        {formatRelativeTime(event.timestamp)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-450">
                    No recent activities recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
