import { useQuery } from '@tanstack/react-query';
import { fetchRegimeSeries } from '../api/regimeApi';

/**
 * Long regime snapshot series (DESC by as_of_date) used for sparklines,
 * regime history ribbon, and episode statistics.
 */
export function useRegimeSeries(limit = 500) {
  return useQuery({
    queryKey: ['regime-series', limit],
    queryFn: () => fetchRegimeSeries(limit),
    staleTime: 5 * 60 * 1000,
    refetchInterval: false,
  });
}
