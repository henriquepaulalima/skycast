import { Request } from 'express';
import { clientIp } from './client-ip';
import { ClientIpThrottlerGuard } from './client-ip-throttler.guard';

describe('clientIp', () => {
  const request = (headers: Record<string, string | string[]>, ip?: string) =>
    ({ headers, ip, socket: { remoteAddress: '100.64.0.9' } }) as unknown as Request;

  it("uses Railway's X-Real-IP header", () => {
    expect(clientIp(request({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '6.6.6.6' }, '100.64.0.2'))).toBe('203.0.113.7');
    expect(clientIp(request({ 'x-real-ip': ['203.0.113.8'] }))).toBe('203.0.113.8');
  });

  it('falls back to the request and socket addresses', () => {
    expect(clientIp(request({}, '127.0.0.1'))).toBe('127.0.0.1');
    expect(clientIp(request({}))).toBe('100.64.0.9');
  });

  it('is what the throttler tracks', async () => {
    const getTracker = (ClientIpThrottlerGuard.prototype as unknown as { getTracker(request: Request): Promise<string> }).getTracker;

    await expect(getTracker(request({ 'x-real-ip': '203.0.113.7' }, '100.64.0.2'))).resolves.toBe('203.0.113.7');
  });
});
