import { Request } from 'express';

// Railway's edge overwrites X-Real-IP with the connecting address; the socket address is Railway's internal proxy.
export function clientIp(request: Request): string {
  const realIp = request.headers['x-real-ip'];

  return (Array.isArray(realIp) ? realIp[0] : realIp) || request.ip || request.socket.remoteAddress || 'unknown';
}
