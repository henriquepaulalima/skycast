import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_MONTHLY_TILE_LIMIT = 30_000;
const DEFAULT_WARNING_THRESHOLD = 0.8;
const DEFAULT_USAGE_FILE = resolve(process.cwd(), '.data/rainbow-usage.json');

interface UsageState {
  month: string;
  tiles: number;
}

@Injectable()
export class RainbowUsageService {
  private readonly logger = new Logger(RainbowUsageService.name);
  private state = this.readState();

  public reserveTile(): UsageState {
    const currentMonth = this.currentMonth();

    if (this.state.month !== currentMonth) {
      this.state = { month: currentMonth, tiles: 0 };
    }

    const monthlyLimit = this.monthlyTileLimit();

    if (monthlyLimit <= 0) {
      return this.state;
    }

    if (this.state.tiles >= monthlyLimit) {
      throw new HttpException('Rainbow monthly tile limit reached', HttpStatus.TOO_MANY_REQUESTS);
    }

    this.state = {
      ...this.state,
      tiles: this.state.tiles + 1
    };
    this.persistState();
    this.warnIfNeeded(monthlyLimit);

    return this.state;
  }

  public usage(): UsageState & { limit: number; remaining: number } {
    const monthlyLimit = this.monthlyTileLimit();
    const currentMonth = this.currentMonth();
    const tiles = this.state.month === currentMonth ? this.state.tiles : 0;

    return {
      limit: monthlyLimit,
      month: currentMonth,
      remaining: monthlyLimit <= 0 ? Number.POSITIVE_INFINITY : Math.max(monthlyLimit - tiles, 0),
      tiles
    };
  }

  private readState(): UsageState {
    try {
      const state = JSON.parse(readFileSync(this.usageFile(), 'utf8')) as UsageState;

      if (typeof state.month === 'string' && Number.isInteger(state.tiles)) {
        return state;
      }
    } catch {
      return { month: this.currentMonth(), tiles: 0 };
    }

    return { month: this.currentMonth(), tiles: 0 };
  }

  private persistState(): void {
    const usageFile = this.usageFile();

    mkdirSync(dirname(usageFile), { recursive: true });
    writeFileSync(usageFile, JSON.stringify(this.state, null, 2));
  }

  private usageFile(): string {
    return process.env.RAINBOW_USAGE_FILE || DEFAULT_USAGE_FILE;
  }

  private currentMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  private monthlyTileLimit(): number {
    const configuredLimit = Number(process.env.RAINBOW_MONTHLY_TILE_LIMIT);

    if (!Number.isFinite(configuredLimit)) {
      return DEFAULT_MONTHLY_TILE_LIMIT;
    }

    return Math.max(Math.floor(configuredLimit), 0);
  }

  private warnIfNeeded(monthlyLimit: number): void {
    const warningThreshold = Number(process.env.RAINBOW_USAGE_WARNING_THRESHOLD || DEFAULT_WARNING_THRESHOLD);

    if (!Number.isFinite(warningThreshold) || warningThreshold <= 0 || warningThreshold > 1) {
      return;
    }

    if (this.state.tiles === Math.ceil(monthlyLimit * warningThreshold)) {
      this.logger.warn(`Rainbow tile usage reached ${this.state.tiles}/${monthlyLimit} for ${this.state.month}`);
    }
  }
}
