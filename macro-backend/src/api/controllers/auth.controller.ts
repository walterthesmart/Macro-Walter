import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';

@Controller('api/v1/auth')
export class AuthController {
  @Post('verify')
  @HttpCode(200)
  verify(@Body() body: { password?: string }) {
    const sitePassword = process.env.SITE_PASSWORD;

    // Open mode (local dev): SITE_PASSWORD unset or empty
    if (!sitePassword) {
      return { ok: true };
    }

    if (body?.password === sitePassword) {
      return { ok: true };
    }

    throw new UnauthorizedException('Invalid password');
  }
}
