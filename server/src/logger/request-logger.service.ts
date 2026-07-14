import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerService implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerService.name);

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();
    const { method, originalUrl } = request;
    const userAgent = request.get('user-agent') || 'unknown';
    const ip = request.ip || request.socket.remoteAddress || 'unknown';

    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const { statusCode } = response;

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${durationMs}ms - ${ip} - ${userAgent}`
      );
    });

    next();
  }
}
