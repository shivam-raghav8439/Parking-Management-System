import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parkingApi } from '../api/parkingApi';
import toast from 'react-hot-toast';

export function useActiveRecords() {
  return useQuery({
    queryKey: ['active-records'],
    queryFn: parkingApi.getActiveRecords,
    refetchInterval: 30000, // Auto-refresh active list every 30 seconds
  });
}

export function useSearchRecords(query) {
  return useQuery({
    queryKey: ['search-records', query],
    queryFn: () => parkingApi.searchRecords(query),
    enabled: query !== undefined && query !== null && query.trim() !== '',
    keepPreviousData: true
  });
}

export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: parkingApi.createEntryRecord,
    onSuccess: (data) => {
      // Invalidate all relevant queries to trigger UI refresh
      queryClient.invalidateQueries({ queryKey: ['parking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['parking-activity'] });
      queryClient.invalidateQueries({ queryKey: ['parking-slots'] });
      queryClient.invalidateQueries({ queryKey: ['active-records'] });
      queryClient.invalidateQueries({ queryKey: ['parking-records'] });
      
      toast.success(`Entry successful! Assigned Slot: ${data.slotNumber}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to register entry.');
    }
  });
}

export function useExitRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, fee, durationMinutes, exitTime }) => 
      parkingApi.exitRecord({ id, fee, durationMinutes, exitTime }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['parking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['parking-activity'] });
      queryClient.invalidateQueries({ queryKey: ['parking-slots'] });
      queryClient.invalidateQueries({ queryKey: ['active-records'] });
      queryClient.invalidateQueries({ queryKey: ['parking-records'] });
      
      toast.success(`Exit registered. Fee of ₹${data.fee} collected!`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to register exit.');
    }
  });
}
