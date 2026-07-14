import { Controller, Get, NotFoundException, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { isRadarFeatureEnabled } from './radar-feature';
import { RainbowRadarService } from './rainbow-radar.service';

@Controller('radar')
export class RadarController {
  constructor(private readonly rainbowRadarService: RainbowRadarService) {}

  @Get('snapshot')
  public snapshot(@Query('layer') layer = 'precip'): Promise<{ snapshot: number }> {
    this.assertRadarEnabled();

    return this.rainbowRadarService.getSnapshot(layer);
  }

  @Get('usage')
  public usage(): ReturnType<RainbowRadarService['usage']> {
    this.assertRadarEnabled();

    return this.rainbowRadarService.usage();
  }

  @Get('tiles/precip/:snapshot/:forecastTime/:zoom/:tileX/:tileY')
  public async precipitationTile(
    @Param('snapshot') snapshot: string,
    @Param('forecastTime') forecastTime: string,
    @Param('zoom') zoom: string,
    @Param('tileX') tileX: string,
    @Param('tileY') tileY: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
    this.assertRadarEnabled();

    const tile = await this.rainbowRadarService.getPrecipitationTile(snapshot, forecastTime, zoom, tileX, tileY);

    response.setHeader('Content-Type', tile.contentType);
    response.setHeader('Cache-Control', 'public, max-age=3600, immutable');

    return new StreamableFile(tile.body);
  }

  private assertRadarEnabled(): void {
    if (!isRadarFeatureEnabled()) {
      throw new NotFoundException();
    }
  }
}
