import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { RegimeSnapshot } from './database/entities/regime-snapshot.entity';
import { ThresholdsConfig } from './database/entities/thresholds-config.entity';
import { RegimeModule } from './regime/regime.module';
import { DataFetcherModule } from './data-fetcher/data-fetcher.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: 60,
          limit: 100,
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true, // Use synchronize for dev instead of migrations
        logging: config.get('NODE_ENV') !== 'production',
      }),
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([RegimeSnapshot, ThresholdsConfig]),
    RegimeModule,
    DataFetcherModule,
    ApiModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
