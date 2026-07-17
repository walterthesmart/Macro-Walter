import { Injectable } from '@nestjs/common';
import { GrowthState, InflationState } from '../../database/entities/regime-snapshot.entity';

@Injectable()
export class GridMapperService {
  map(g: GrowthState, i: InflationState): string {
    const map: Record<string, string> = {
      'G+_I-': 'Disinflationary Expansion',
      'G+_I=': 'Balanced Expansion',
      'G+_I+': 'Overheating',
      'G=_I+': 'Inflationary Pressure',
      'G-_I+': 'Stagflation',
      'G-_I=': 'Slowdown',
      'G-_I-': 'Disinflationary Contraction',
    };
    return map[`${g}_${i}`] || 'Transition / Mixed signals';
  }
}
