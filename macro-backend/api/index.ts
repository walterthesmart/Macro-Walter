import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

let cached: any = null;
let bootError: any = null;

async function bootstrap() {
  if (!cached && !bootError) {
    try {
      const app = await NestFactory.create(AppModule);
      app.enableCors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' });
      app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
      await app.init();
      cached = app.getHttpAdapter().getInstance();
    } catch (err: any) {
      bootError = err;
      // Shows up in Vercel runtime logs
      console.error('BOOTSTRAP FAILED:', err);
    }
  }
  return cached;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrap();
  if (!server) {
    // Surface the real error instead of an opaque FUNCTION_INVOCATION_FAILED
    res.status(500).json({
      error: 'bootstrap_failed',
      message: bootError?.message ?? String(bootError),
      hint: 'Most likely: DATABASE_URL missing/wrong, or database unreachable. Check Vercel project env vars and redeploy.',
    });
    return;
  }
  return server(req, res);
}
