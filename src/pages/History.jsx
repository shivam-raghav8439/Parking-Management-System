import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDebounce } from '../hooks/useDebounce';
import { parkingApi } from '../api/parkingApi';
import { formatDateTime, formatDuration, formatRelativeTime } from '../utils/formatTime';
import Badge from '../components/Badge';
import { TableSkeleton } from '../components/Loader';
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  Calendar,
  RefreshCw,
  History as HistoryIcon,
  ShieldAlert
} from 'lucide-react';

export default function History() {
  const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles' or 'audit'
  
  // Vehicles pagination & filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState('All');
  const [zone, setZone] = useState('All');
  const [vehicleType, setVehicleType] = useState('All');
  const [ownerType, setOwnerType] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Audit Logs pagination
  const [auditPage, setAuditPage] = useState(1);

  // Fetch paginated and filtered history records (Vehicles tab)
  const { 
    data: vehicleData, 
    isLoading: isVehiclesLoading, 
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchVehicles, 
    isFetching: isVehiclesFetching 
  } = useInfiniteQuery({
    queryKey: ['parking-records', debouncedSearch, status, zone, vehicleType, ownerType, startDate, endDate],
    queryFn: ({ pageParam = 1 }) => parkingApi.getRecords({
      page: pageParam,
      limit: 20,
      search: debouncedSearch.trim() || undefined,
      status: status !== 'All' ? status.toLowerCase() : undefined,
      zone: zone !== 'All' ? zone : undefined,
      vehicleType: vehicleType !== 'All' ? vehicleType : undefined,
      ownerType: ownerType !== 'All' ? ownerType : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }),
    getNextPageParam: (lastPage) => {
      return lastPage.currentPage < lastPage.totalPages ? lastPage.currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: activeTab === 'vehicles'
  });

  const records = vehicleData?.pages.flatMap(page => page.records) || [];
  const totalCount = vehicleData?.pages[0]?.totalCount || 0;

  const parentRef = useRef();

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? records.length + 1 : records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52, // estimated height of row in px
    overscan: 5,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;

    if (
      lastItem.index >= records.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    records.length,
    rowVirtualizer.getVirtualItems(),
  ]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('All');
    setZone('All');
    setVehicleType('All');
    setOwnerType('All');
    setStartDate('');
    setEndDate('');
  };// Fetch paginated system audit logs (Audit tab)
  const { 
    data: auditData, 
    isLoading: isAuditLoading, 
    refetch: refetchAudit, 
    isFetching: isAuditFetching 
  } = useQuery({
    queryKey: ['system-audit-logs', auditPage],
    queryFn: () => parkingApi.getAuditLogs({
      page: auditPage,
      limit: 20
    }),
    enabled: activeTab === 'audit',
    keepPreviousData: true
  });



  const handleExportCSV = () => {
    if (records.length === 0) return;
    
    const headers = [
      'License Plate', 
      'Owner Name', 
      'Vehicle Category', 
      'Owner Category', 
      'Allocated Slot', 
      'Entry Time', 
      'Exit Time', 
      'Duration (Minutes)', 
      'Fee Charged (INR)', 
      'Status'
    ];

    const rows = records.map(r => [
      r.plate,
      `"${r.ownerName.replace(/"/g, '""')}"`,
      r.vehicleType,
      r.ownerType,
      r.slotNumber,
      r.entryTime,
      r.exitTime || 'N/A',
      r.durationMinutes || 0,
      r.fee || 0,
      r.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `parking_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50';
      case 'REGISTER':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50';
      case 'VEHICLE_ENTRY':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50';
      case 'VEHICLE_EXIT':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50';
      case 'SETTINGS_UPDATE':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50';
      case 'SLOT_UPDATE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
            Transaction & System Logs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Search vehicle sessions or inspect the system-wide operator audit trail.
          </p>
        </div>
        {activeTab === 'vehicles' && (
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={records.length === 0}
              className="px-4 py-2.5 bg-emerald-650 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export to CSV
            </button>
            <button
              onClick={() => refetchVehicles()}
              className="p-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 rounded-xl transition-all"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${isVehiclesFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
        {activeTab === 'audit' && (
          <div className="flex gap-2">
            <button
              onClick={() => refetchAudit()}
              className="p-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 rounded-xl transition-all"
              title="Refresh Audit Logs"
            >
              <RefreshCw className={`w-4 h-4 ${isAuditFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-slate-250 dark:border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'vehicles'
              ? 'border-primary-600 text-primary-750 dark:text-primary-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <HistoryIcon className="w-4.5 h-4.5" />
          Vehicle Parking Slips
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'border-primary-600 text-primary-750 dark:text-primary-400 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <ShieldAlert className="w-4.5 h-4.5" />
          System Audit Trail
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VEHICLES LOGS TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'vehicles' && (
        <>
          {/* Filter Dashboard */}
          <div className="glass-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wide">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase">Search Text</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Plate, Owner name, Slot..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-250/70 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase">Status</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-250/70 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white dark:bg-slate-900 outline-none"
                >
                  <option value="All">All statuses</option>
                  <option value="Active">Active (Parked)</option>
                  <option value="Exited">Exited (Settled)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase">Zone</label>
                <select
                  value={zone}
                  onChange={(e) => { setZone(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-250/70 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white dark:bg-slate-900 outline-none"
                >
                  <option value="All">All zones</option>
                  <option value="A">Zone A (Cars)</option>
                  <option value="B">Zone B (Bikes)</option>
                  <option value="C">Zone C (Faculty)</option>
                  <option value="D">Zone D (Visitors)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase">Vehicle Type</label>
                <select
                  value={vehicleType}
                  onChange={(e) => { setVehicleType(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-250/70 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white dark:bg-slate-900 outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Bus">Bus</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase">Owner Type</label>
                <select
                  value={ownerType}
                  onChange={(e) => { setOwnerType(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-250/70 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white dark:bg-slate-900 outline-none"
                >
                  <option value="All">All Members</option>
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Staff">Staff</option>
                  <option value="Visitor">Visitor</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-250/70 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-250/70 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-205 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-300 rounded-xl text-xs font-semibold border border-transparent dark:border-slate-750"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
            {isVehiclesLoading ? (
              <div className="p-6">
                <TableSkeleton rows={8} cols={9} />
              </div>
            ) : records.length > 0 ? (
              <div 
                ref={parentRef} 
                className="overflow-y-auto max-h-[550px] relative border-b border-slate-200 dark:border-slate-800"
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-905/90 backdrop-blur-sm z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)] dark:shadow-[0_1px_0_0_rgba(30,41,59,1)]">
                      <tr className="flex border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-950/20">
                        <th className="py-4 px-6 flex-[1.2] min-w-[120px]">Plate Number</th>
                        <th className="py-4 px-4 flex-[1.5] min-w-[150px]">Owner Name</th>
                        <th className="py-4 px-4 flex-[1.2] min-w-[120px]">Category</th>
                        <th className="py-4 px-4 flex-[0.8] min-w-[80px]">Slot</th>
                        <th className="py-4 px-4 flex-[1.5] min-w-[150px]">In Time</th>
                        <th className="py-4 px-4 flex-[1.5] min-w-[150px]">Out Time</th>
                        <th className="py-4 px-4 flex-[1.0] min-w-[100px]">Duration</th>
                        <th className="py-4 px-4 flex-[0.8] min-w-[80px]">Fee Paid</th>
                        <th className="py-4 px-6 flex-[0.8] min-w-[85px] text-right justify-end">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const isLoaderRow = virtualRow.index === records.length;
                        
                        if (isLoaderRow) {
                          return (
                            <tr
                              key="loader-row"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                              className="flex items-center justify-center py-4 text-slate-450 border-b border-slate-100 dark:border-slate-800/50"
                            >
                              <td className="w-full text-center flex justify-center items-center py-2 font-semibold">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                                Loading more records...
                              </td>
                            </tr>
                          );
                        }

                        const rec = records[virtualRow.index];
                        if (!rec) return null;
                        
                        const hours = Math.floor((rec.durationMinutes || 0) / 60);
                        const mins = (rec.durationMinutes || 0) % 60;

                        return (
                          <tr
                            key={rec.id || rec._id || virtualRow.index}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: `${virtualRow.size}px`,
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                            className="flex items-center hover:bg-slate-50/50 dark:hover:bg-slate-850/50 border-b border-slate-100 dark:border-slate-800/50 transition-colors"
                          >
                            <td className="px-6 flex-[1.2] min-w-[120px] truncate">
                              <span className="license-plate-small">{rec.plate}</span>
                            </td>
                            <td className="px-4 flex-[1.5] min-w-[150px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {rec.ownerName}
                            </td>
                            <td className="px-4 flex-[1.2] min-w-[120px] flex flex-col gap-0.5 items-start justify-center">
                              <Badge type={rec.vehicleType}>{rec.vehicleType}</Badge>
                              <span className="text-[10px] text-slate-400">{rec.ownerType}</span>
                            </td>
                            <td className="px-4 flex-[0.8] min-w-[80px] font-mono font-extrabold text-slate-650 dark:text-slate-400 truncate">
                              {rec.slotId || rec.slotNumber}
                            </td>
                            <td className="px-4 flex-[1.5] min-w-[150px] text-slate-505 dark:text-slate-400 font-mono text-[11px] truncate">
                              {formatDateTime(rec.entryTime)}
                            </td>
                            <td className="px-4 flex-[1.5] min-w-[150px] text-slate-505 dark:text-slate-400 font-mono text-[11px] truncate">
                              {rec.exitTime ? formatDateTime(rec.exitTime) : 'N/A'}
                            </td>
                            <td className="px-4 flex-[1.0] min-w-[100px] font-semibold text-slate-705 dark:text-slate-350 truncate">
                              {rec.exitTime ? formatDuration(hours, mins) : '--'}
                            </td>
                            <td className="px-4 flex-[0.8] min-w-[80px] font-bold text-slate-800 dark:text-slate-200 truncate">
                              {rec.fee !== null && rec.fee !== undefined ? `₹${rec.fee}` : '--'}
                            </td>
                            <td className="px-6 flex-[0.8] min-w-[85px] text-right justify-end">
                              <Badge type={rec.status}>{rec.status}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-450 text-sm">
                No vehicle parking logs match the filters selected.
              </div>
            )}

            {/* Total records status bar */}
            {!isVehiclesLoading && records.length > 0 && (
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing <b>{records.length}</b> of <b>{totalCount}</b> total logs.
                </span>
                {isVehiclesFetching && !isFetchingNextPage && (
                  <span className="flex items-center gap-1">
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary-600"></span>
                    Refreshing...
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SYSTEM AUDIT TRAIL LOGS TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'audit' && (
        <div className="glass-card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
          {isAuditLoading ? (
            <div className="p-6">
              <TableSkeleton rows={8} cols={4} />
            </div>
          ) : auditData && auditData.logs && auditData.logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="py-4 px-6">Operation Action</th>
                    <th className="py-4 px-4">Event Description details</th>
                    <th className="py-4 px-4">Triggered By</th>
                    <th className="py-4 px-6 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                  {auditData.logs.map((log) => (
                    <tr key={log.id || log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide inline-flex items-center justify-center ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200 max-w-[350px] truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {log.operator ? log.operator.name : 'System / Auto Seeder'}
                          </span>
                          {log.operator && (
                            <span className="text-[9px] text-slate-400 capitalize">
                              {log.operator.role}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right text-slate-400 dark:text-slate-550 font-mono text-[11px]">
                        <span className="block">{formatDateTime(log.timestamp)}</span>
                        <span className="text-[10px] text-slate-450 block mt-0.5">{formatRelativeTime(log.timestamp)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-450 text-sm">
              No system activity logs found.
            </div>
          )}

          {/* Pagination for Audit Logs */}
          {auditData && auditData.totalPages > 1 && (
            <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing page <b>{auditData.currentPage}</b> of <b>{auditData.totalPages}</b> ({auditData.totalCount} audit logs)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={auditPage === 1}
                  onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                  className="p-2 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-500 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                <button
                  disabled={auditPage === auditData.totalPages}
                  onClick={() => setAuditPage(p => Math.min(auditData.totalPages, p + 1))}
                  className="p-2 border border-slate-250 dark:border-slate-800 rounded-lg text-slate-500 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
