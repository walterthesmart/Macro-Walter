import { Injectable } from '@nestjs/common';
import { GrowthState, InflationState } from '../../database/entities/regime-snapshot.entity';

export interface HysteresisState {
  lastConfirmedG: GrowthState | null;
  lastConfirmedI: InflationState | null;
  pendingG: GrowthState | null;
  pendingI: InflationState | null;
  pendingSince: string | null;
}

@Injectable()
export class HysteresisService {
  apply(
    rawG: GrowthState,
    rawI: InflationState,
    currentDate: string,
    previous: HysteresisState | null,
    sahmTriggered: boolean,
  ): { confirmedG: GrowthState; confirmedI: InflationState; newState: HysteresisState } {
    if (!previous) {
      return {
        confirmedG: rawG,
        confirmedI: rawI,
        newState: {
          lastConfirmedG: rawG,
          lastConfirmedI: rawI,
          pendingG: null,
          pendingI: null,
          pendingSince: null,
        },
      };
    }

    if (sahmTriggered) {
      return {
        confirmedG: GrowthState.G_MINUS,
        confirmedI: rawI,
        newState: {
          ...previous,
          lastConfirmedG: GrowthState.G_MINUS,
          pendingG: null,
          pendingSince: currentDate,
        },
      };
    }

    let confirmedG = previous.lastConfirmedG ?? rawG;
    let confirmedI = previous.lastConfirmedI ?? rawI;
    let pendingG = previous.pendingG;
    let pendingI = previous.pendingI;

    if (rawG !== previous.lastConfirmedG) {
      if (pendingG === rawG) {
        confirmedG = rawG;
        pendingG = null;
      } else {
        pendingG = rawG;
      }
    } else {
      pendingG = null;
    }

    if (rawI !== previous.lastConfirmedI) {
      if (pendingI === rawI) {
        confirmedI = rawI;
        pendingI = null;
      } else {
        pendingI = rawI;
      }
    } else {
      pendingI = null;
    }

    return {
      confirmedG,
      confirmedI,
      newState: {
        lastConfirmedG: confirmedG,
        lastConfirmedI: confirmedI,
        pendingG,
        pendingI,
        pendingSince: (pendingG || pendingI) ? currentDate : null,
      },
    };
  }
}
