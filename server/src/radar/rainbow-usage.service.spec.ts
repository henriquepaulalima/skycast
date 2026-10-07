import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@nestjs/common';
import { RainbowUsageService } from './rainbow-usage.service';

describe('RainbowUsageService', () => {
  const usageFile = resolve(process.cwd(), '.data/rainbow-usage-service-test.json');
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.RAINBOW_USAGE_FILE = usageFile;
    delete process.env.RAINBOW_MONTHLY_TILE_LIMIT;
    delete process.env.RAINBOW_USAGE_WARNING_THRESHOLD;
    rmSync(usageFile, { force: true });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    rmSync(usageFile, { force: true });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("defaults to Rainbow's free tier of 30,000 tiles a month", () => {
    expect(new RainbowUsageService().usage()).toMatchObject({ limit: 30_000, tiles: 0, remaining: 30_000 });
  });

  it('counts tiles and saves the count to the usage file', () => {
    const service = new RainbowUsageService();

    service.reserveTile();
    service.reserveTile();

    expect(service.usage()).toMatchObject({ tiles: 2, remaining: 29_998 });
    expect(JSON.parse(readFileSync(usageFile, 'utf8'))).toMatchObject({ tiles: 2 });
  });

  it('continues from the saved count after a restart', () => {
    writeFileSync(usageFile, JSON.stringify({ month: new Date().toISOString().slice(0, 7), tiles: 41 }));

    expect(new RainbowUsageService().usage().tiles).toBe(41);
  });

  it('starts from zero when the usage file is unreadable', () => {
    writeFileSync(usageFile, '{broken');

    expect(new RainbowUsageService().usage().tiles).toBe(0);
  });

  it('blocks tiles with 429 once the monthly limit is reached', () => {
    process.env.RAINBOW_MONTHLY_TILE_LIMIT = '2';
    const service = new RainbowUsageService();

    service.reserveTile();
    service.reserveTile();

    expect(() => service.reserveTile()).toThrow(expect.objectContaining({ status: 429 }));
    expect(service.usage().remaining).toBe(0);
  });

  it('resets the count in a new month', () => {
    jest.useFakeTimers({ now: new Date('2026-09-30T23:59:00Z') });
    process.env.RAINBOW_MONTHLY_TILE_LIMIT = '1';
    const service = new RainbowUsageService();
    service.reserveTile();

    jest.setSystemTime(new Date('2026-10-01T00:01:00Z'));

    expect(service.usage()).toMatchObject({ month: '2026-10', tiles: 0 });
    expect(() => service.reserveTile()).not.toThrow();
  });

  it('disables the limit and file writes when the limit is 0', () => {
    process.env.RAINBOW_MONTHLY_TILE_LIMIT = '0';
    const service = new RainbowUsageService();

    for (let i = 0; i < 5; i++) service.reserveTile();

    expect(service.usage().remaining).toBe(Number.POSITIVE_INFINITY);
    expect(existsSync(usageFile)).toBe(false);
  });

  it('logs one warning when usage reaches the warning threshold', () => {
    process.env.RAINBOW_MONTHLY_TILE_LIMIT = '10';
    process.env.RAINBOW_USAGE_WARNING_THRESHOLD = '0.5';
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const service = new RainbowUsageService();

    for (let i = 0; i < 7; i++) service.reserveTile();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('5/10'));
  });
});
