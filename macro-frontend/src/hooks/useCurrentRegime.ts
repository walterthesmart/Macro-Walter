import { useQuery } from '@tanstack/react-query';
import { fetchCurrentRegime, fetchRegimeByDate } from '../api/regimeApi';

export function useCurrentRegime(dateParam?: string | null) {
  return useQuery({
    queryKey: ['regime', dateParam || 'current'],
    queryFn: () => (dateParam ? fetchRegimeByDate(dateParam) : fetchCurrentRegime()),
    refetchInterval: dateParam ? false : 5 * 60 * 1000,
    staleTime: 60 * 1000,
  });
}
