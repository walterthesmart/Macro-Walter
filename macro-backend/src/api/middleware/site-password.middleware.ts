import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SitePasswordMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const sitePassword = process.env.SITE_PASSWORD;

    // Open access (local dev) when SITE_PASSWORD is unset or empty
    if (!sitePassword) {
      return next();
    }

    const provided = req.headers['x-site-password'];
    if (provided === sitePassword) {
      return next();
    }

    return res.status(401).json({
      statusCode: 401,
      message: 'Password required',
    });
  }
}
