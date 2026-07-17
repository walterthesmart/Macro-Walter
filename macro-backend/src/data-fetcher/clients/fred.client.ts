import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FredClient {
  private readonly logger = new Logger(FredClient.name);
  private apiKey: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.apiKey = this.configService.get<string>('FRED_API_KEY');
  }

  async fetchSeries(seriesId: string, from?: string): Promise<{ date: string; value: number }[]> {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&sort_order=asc`;
    try {
      const response = await firstValueFrom(this.httpService.get(url));
      const data = response.data;
      return data.observations
        .filter((obs: any) => obs.value !== '.')
        .map((obs: any) => ({
          date: obs.date,
          value: parseFloat(obs.value),
        }));
    } catch (error) {
      this.logger.error(`Error fetching FRED series ${seriesId}: ${error.message}`);
      throw error;
    }
  }
}
