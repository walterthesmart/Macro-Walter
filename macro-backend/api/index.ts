import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

let cached: any = null;

async function bootstrap() {
  if (!cached) {
    const app = await NestFactory.create(AppModule);
    app.enableCors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' });
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
    cached = app.getHttpAdapter().getInstance();
  }
  return cached;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrap();
  return server(req, res);
}
