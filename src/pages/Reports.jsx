import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { parkingApi } from '../api/parkingApi';
import { Spinner } from '../components/Loader';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { BarChart3, TrendingUp, Compass, Activity, Thermometer } from 'lucide-react';

export default function Reports() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: parkingApi.getReportsSummary
  });

  const COLORS = {
    Car: '#3b82f6',     // blue-500
    Bike: '#8b5cf6',    // violet-500
    Bicycle: '#14b8a6', // teal-500
    Bus: '#6366f1'      // indigo-500
  };

  const getHeatmapColor = (count) => {
    if (count === 0) return 'bg-slate-50 dark:bg-slate-900/35 text-slate-300 dark:text-slate-800';
    if (count < 5) return 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-500';
    if (count < 12) return 'bg-blue-150 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400';
    if (count < 22) return 'bg-blue-300 dark:bg-blue-800/60 text-blue-800 dark:text-blue-300';
    return 'bg-primary-600 text-white font-extrabold shadow-sm'; // Very High Density
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col justify-center items-center gap-3">
        <Spinner />
        <span className="text-slate-400 text-sm">Generating reports summary analytics...</span>
      </div>
    );
  }

  // Pre-process heatmap data to group by hour
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hoursOfOperations = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
  ];

  // Map heatmap data into an easy lookup structure
  const heatmapLookup = {};
  if (summary?.heatmapData) {
    summary.heatmapData.forEach(cell => {
      heatmapLookup[`${cell.hour}_${cell.day}`] = cell.count;
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
          Analytics & Performance Reports
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Detailed metrics showing utilization, revenue generation, and parking patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Revenue Bar Chart */}
        <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Daily Revenue Flow</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total fees captured over the last 7 days</p>
            </div>
          </div>
          <div className="h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.dailyRevenue || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                <XAxis dataKey="date" tickLine={false} stroke="rgba(148, 163, 184, 0.5)" />
                <YAxis tickLine={false} stroke="rgba(148, 163, 184, 0.5)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'transparent', borderRadius: '8px', color: '#fff' }} 
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Type Distribution Pie Chart */}
        <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Vehicle Category Mix</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Proportional share of vehicles parked on campus</p>
            </div>
          </div>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-around">
            <div className="h-56 w-56 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary?.vehicleDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(summary?.vehicleDistribution || []).map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Vehicles']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4 sm:mt-0">
              {(summary?.vehicleDistribution || []).map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[entry.name] }}></span>
                  <span className="font-medium text-slate-655 dark:text-slate-400">{entry.name}:</span>
                  <span className="font-bold text-slate-850 dark:text-white">{entry.value} logged</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Zone Utilization Over Time Line Chart */}
        <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Zone Load Timeline</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hourly load percentage (%) tracking for A/B/C/D zones</p>
            </div>
          </div>
          <div className="h-64 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary?.zoneUtilization || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                <XAxis dataKey="time" tickLine={false} stroke="rgba(148, 163, 184, 0.5)" />
                <YAxis tickLine={false} stroke="rgba(148, 163, 184, 0.5)" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'transparent', borderRadius: '8px', color: '#fff' }} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="A" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Zone A" />
                <Line type="monotone" dataKey="B" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Zone B" />
                <Line type="monotone" dataKey="C" stroke="#d946ef" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Zone C" />
                <Line type="monotone" dataKey="D" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Zone D" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap Section */}
        <div className="glass-card p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Peak Hours Heatmap</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Density load based on checked-in count per operating hour</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[450px]">
              {/* Day Headers */}
              <div className="grid grid-cols-12 gap-1 mb-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="col-span-2 text-left">Hour</div>
                {daysOfWeek.map(d => (
                  <div key={d} className="col-span-1">{d}</div>
                ))}
                <div className="col-span-3"></div>
              </div>

              {/* Grid Rows */}
              <div className="space-y-1">
                {hoursOfOperations.map((hour) => (
                  <div key={hour} className="grid grid-cols-12 gap-1 items-center">
                    <div className="col-span-2 text-[10px] font-semibold font-mono text-slate-550 dark:text-slate-400">{hour}</div>
                    {daysOfWeek.map((day) => {
                      const count = heatmapLookup[`${hour}_${day}`] || 0;
                      return (
                        <div
                          key={day}
                          title={`${hour} on ${day}: ${count} active vehicles`}
                          className={`col-span-1 h-7 rounded-md flex items-center justify-center text-[10px] transition-all hover:scale-105 duration-200 ${getHeatmapColor(count)}`}
                        >
                          {count > 0 ? count : ''}
                        </div>
                      );
                    })}
                    <div className="col-span-3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Density legend */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-wrap gap-4 items-center justify-between text-[10px] text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Density scale:</span>
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"></span>
                Empty
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-blue-50 dark:bg-blue-950/20"></span>
                1 - 5
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-blue-200 dark:bg-blue-800/40"></span>
                6 - 11
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-blue-300 dark:bg-blue-800/60"></span>
                12 - 21
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded bg-primary-650"></span>
                22+ peak
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
