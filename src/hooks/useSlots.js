import { useQuery } from '@tanstack/react-query';
import { parkingApi } from '../api/parkingApi';

export function useSlots() {
  return useQuery({
    queryKey: ['parking-slots'],
    queryFn: parkingApi.getSlots,
    refetchInterval: 20000, // Auto-refresh slots every 20 seconds
  });
}
