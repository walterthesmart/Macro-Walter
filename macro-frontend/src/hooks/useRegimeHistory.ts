import { useQuery } from '@tanstack/react-query';
import { fetchRegimeHistory } from '../api/regimeApi';

export function useRegimeHistory(page: number, limit: number, regimeFilter: string) {
  return useQuery({
    queryKey: ['history', page, limit, regimeFilter],
    queryFn: () =>
      fetchRegimeHistory({
        offset: page * limit,
        limit,
        regime: regimeFilter || undefined,
      }),
  });
}
