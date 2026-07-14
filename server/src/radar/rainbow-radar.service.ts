import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { get } from 'node:https';
import { RainbowUsageService } from './rainbow-usage.service';

const RAINBOW_API_URL = 'https://api.rainbow.ai';
const SNAPSHOT_CACHE_MS = 60_000;
const ALLOWED_LAYERS = new Set(['precip', 'precip-global', 'clouds', 'radars']);

interface SnapshotCacheEntry {
  expiresAt: number;
  snapshot: number;
}

interface RainbowSnapshotResponse {
  snapshot?: number;
}

interface RainbowTileResponse {
  body: Buffer;
  contentType: string;
}

@Injectable()
export class RainbowRadarService {
  private readonly snapshotCache = new Map<string, SnapshotCacheEntry>();

  constructor(private readonly rainbowUsageService: RainbowUsageService) {}

  public async getSnapshot(layer: string): Promise<{ snapshot: number }> {
    const normalizedLayer = layer || 'precip';

    if (!ALLOWED_LAYERS.has(normalizedLayer)) {
      throw new BadRequestException('layer must be one of precip, precip-global, clouds, or radars');
    }

    const cachedSnapshot = this.snapshotCache.get(normalizedLayer);
    const now = Date.now();

    if (cachedSnapshot && cachedSnapshot.expiresAt > now) {
      return { snapshot: cachedSnapshot.snapshot };
    }

    const url = this.rainbowUrl('/tiles/v1/snapshot');

    url.searchParams.set('layer', normalizedLayer);

    const response = await this.fetchJson<RainbowSnapshotResponse>(url);
    const snapshot = response.snapshot;

    if (typeof snapshot !== 'number' || !Number.isInteger(snapshot)) {
      throw new BadGatewayException('Rainbow returned an invalid snapshot response');
    }

    this.snapshotCache.set(normalizedLayer, {
      expiresAt: now + SNAPSHOT_CACHE_MS,
      snapshot
    });

    return { snapshot };
  }

  public async getPrecipitationTile(
    snapshot: string,
    forecastTime: string,
    zoom: string,
    tileX: string,
    tileY: string
  ): Promise<RainbowTileResponse> {
    const parsedSnapshot = this.parseInteger(snapshot, 'snapshot');
    const parsedForecastTime = this.parseInteger(forecastTime, 'forecastTime');
    const parsedZoom = this.parseInteger(zoom, 'zoom');
    const parsedTileX = this.parseInteger(tileX, 'tileX');
    const parsedTileY = this.parseInteger(tileY, 'tileY');

    if (parsedForecastTime < 0 || parsedForecastTime > 14_400 || parsedForecastTime % 600 !== 0) {
      throw new BadRequestException('forecastTime must be between 0 and 14400 in 600 second steps');
    }

    if (parsedZoom < 0 || parsedZoom > 12) {
      throw new BadRequestException('zoom must be between 0 and 12');
    }

    const maxTileCoordinate = 2 ** parsedZoom - 1;

    if (parsedTileX < 0 || parsedTileX > maxTileCoordinate || parsedTileY < 0 || parsedTileY > maxTileCoordinate) {
      throw new BadRequestException('tile coordinates are outside the selected zoom range');
    }

    const url = this.rainbowUrl(`/tiles/v1/precip/${parsedSnapshot}/${parsedForecastTime}/${parsedZoom}/${parsedTileX}/${parsedTileY}`);

    this.rainbowUsageService.reserveTile();

    return this.fetchBuffer(url);
  }

  public usage(): ReturnType<RainbowUsageService['usage']> {
    return this.rainbowUsageService.usage();
  }

  private rainbowUrl(path: string): URL {
    const token = process.env.RAINBOW_API_TOKEN;

    if (!token) {
      throw new ServiceUnavailableException('RAINBOW_API_TOKEN is not configured');
    }

    const url = new URL(path, RAINBOW_API_URL);

    url.searchParams.set('token', token);

    return url;
  }

  private parseInteger(value: string, name: string): number {
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue)) {
      throw new BadRequestException(`${name} must be an integer`);
    }

    return parsedValue;
  }

  private async fetchJson<T>(url: URL): Promise<T> {
    const response = await this.fetch(url);

    try {
      return JSON.parse(response.body.toString('utf8')) as T;
    } catch {
      throw new BadGatewayException('Rainbow returned invalid JSON');
    }
  }

  private async fetchBuffer(url: URL): Promise<RainbowTileResponse> {
    const response = await this.fetch(url);

    return {
      body: response.body,
      contentType: response.contentType || 'image/png'
    };
  }

  private async fetch(url: URL): Promise<RainbowTileResponse> {
    return new Promise((resolve, reject) => {
      const request = get(url, { family: 4, headers: { 'user-agent': 'skycast/0.1' } }, (response) => {
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        response.on('end', () => {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            reject(new BadGatewayException(`Rainbow request failed with ${response.statusCode}`));
            return;
          }

          resolve({
            body: Buffer.concat(chunks),
            contentType: response.headers['content-type'] || 'application/octet-stream'
          });
        });
      });

      request.on('error', (error) => {
        reject(new BadGatewayException(`Rainbow request failed: ${error.message}`));
      });
      request.end();
    });
  }
}
