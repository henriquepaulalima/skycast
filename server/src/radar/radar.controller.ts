import { Controller, Get, Param, Query, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { RainbowRadarService } from './rainbow-radar.service';

@Controller('radar')
export class RadarController {
  constructor(private readonly rainbowRadarService: RainbowRadarService) {}

  @Get('snapshot')
  public snapshot(@Query('layer') layer = 'precip'): Promise<{ snapshot: number }> {
    return this.rainbowRadarService.getSnapshot(layer);
  }

  @Get('usage')
  public usage(): ReturnType<RainbowRadarService['usage']> {
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
    const tile = await this.rainbowRadarService.getPrecipitationTile(snapshot, forecastTime, zoom, tileX, tileY);

    response.setHeader('Content-Type', tile.contentType);
    response.setHeader('Cache-Control', 'public, max-age=3600, immutable');

    return new StreamableFile(tile.body);
  }
}
