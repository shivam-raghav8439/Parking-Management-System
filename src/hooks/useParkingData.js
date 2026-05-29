import { useQuery } from '@tanstack/react-query';
import { parkingApi } from '../api/parkingApi';

export function useParkingStats() {
  return useQuery({
    queryKey: ['parking-stats'],
    queryFn: parkingApi.getStats,
    refetchInterval: 15000, // Refresh dashboard stats every 15 seconds
  });
}

export function useParkingActivity() {
  return useQuery({
    queryKey: ['parking-activity'],
    queryFn: parkingApi.getActivity,
    refetchInterval: 10000, // Refresh activity feed every 10 seconds
  });
}
