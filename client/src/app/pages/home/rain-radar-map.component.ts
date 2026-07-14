import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, inject, signal } from '@angular/core';
import type * as Leaflet from 'leaflet';
import { firstValueFrom } from 'rxjs';
import { CityLocation } from '../../models/weather.models';
import { ApiService } from '../../services/api.service';
import { AppSettingsService } from '../../services/app-settings.service';

@Component({
  selector: 'app-rain-radar-map',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './rain-radar-map.component.html',
  styleUrl: './rain-radar-map.component.scss'
})
export class RainRadarMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly appSettings = inject(AppSettingsService);

  @Input({ required: true }) public location: CityLocation | null = null;
  @ViewChild('mapContainer') private readonly mapContainer?: ElementRef<HTMLElement>;

  public readonly loading = signal(false);
  public readonly unavailable = signal(false);
  public readonly mapOpen = signal(false);
  public readonly mapButtonVisible = import.meta.env.NG_APP_ENV !== 'prod' && import.meta.env['ENV'] !== 'prod';
  public readonly opacity = signal(72);
  public readonly forecastTime = signal(0);
  public readonly updatedAt = signal<Date | null>(null);

  private leaflet: typeof Leaflet | null = null;
  private map: Leaflet.Map | null = null;
  private locationMarker: Leaflet.CircleMarker | null = null;
  private precipitationLayer: Leaflet.TileLayer | null = null;
  private snapshot: number | null = null;
  private refreshIntervalId: number | null = null;
  private refreshInFlight = false;

  public ngAfterViewInit(): void {
    if (this.mapOpen()) {
      void this.initializeMap();
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (!changes['location'] || !this.map || !this.location) {
      return;
    }

    this.showLocation(this.location);
  }

  public ngOnDestroy(): void {
    this.stopRefreshTimer();
    this.map?.remove();
  }

  public t(key: Parameters<AppSettingsService['t']>[0]): string {
    return this.appSettings.t(key);
  }

  public setForecastTime(forecastTime: number): void {
    if (this.forecastTime() === forecastTime) {
      return;
    }

    this.forecastTime.set(forecastTime);
    this.replacePrecipitationLayer();
  }

  public setOpacityFromEvent(event: Event): void {
    const target = event.target as HTMLInputElement;
    const opacity = Number(target.value);

    if (!Number.isFinite(opacity)) {
      return;
    }

    this.opacity.set(opacity);
    this.precipitationLayer?.setOpacity(opacity / 100);
  }

  public openMap(): void {
    this.mapOpen.set(true);

    window.setTimeout(() => {
      if (!this.map) {
        void this.initializeMap();
        return;
      }

      this.map.invalidateSize();

      if (this.location) {
        this.showLocation(this.location);
      }
    }, 0);
  }

  public recenterMap(): void {
    if (!this.location || !this.map) {
      return;
    }

    this.showLocation(this.location);
  }

  private async initializeMap(): Promise<void> {
    if (!this.mapContainer) {
      return;
    }

    const L = await import('leaflet');

    this.leaflet = L;
    this.map = L.map(this.mapContainer.nativeElement, {
      attributionControl: true,
      maxZoom: 12,
      minZoom: 4,
      zoomControl: false
    }).setView([0, 0], 4);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      className: 'radar-base-map',
      maxZoom: 19
    }).addTo(this.map);

    if (this.location) {
      this.showLocation(this.location);
    }

    window.setTimeout(() => this.map?.invalidateSize(), 0);
  }

  private showLocation(location: CityLocation): void {
    const L = this.leaflet;

    if (!L || !this.map) {
      return;
    }

    const coordinates: Leaflet.LatLngExpression = [location.latitude, location.longitude];

    this.map.setView(coordinates, 8);
    this.locationMarker?.remove();
    this.locationMarker = L.circleMarker(coordinates, {
      color: '#d6f4ff',
      fillColor: '#123848',
      fillOpacity: 0.85,
      radius: 5,
      weight: 2
    }).addTo(this.map);

    this.snapshot = null;
    this.precipitationLayer?.remove();
    this.precipitationLayer = null;
    if (!this.mapOpen()) {
      return;
    }

    // Rainbow requests are intentionally disabled for now. The component opens the Leaflet base map only.
  }

  private startRefreshTimer(): void {
    this.stopRefreshTimer();
    this.refreshIntervalId = window.setInterval(() => {
      void this.refreshSnapshot(false);
    }, 60_000);
  }

  private stopRefreshTimer(): void {
    if (this.refreshIntervalId === null) {
      return;
    }

    window.clearInterval(this.refreshIntervalId);
    this.refreshIntervalId = null;
  }

  private async refreshSnapshot(showLoading: boolean): Promise<void> {
    if (this.refreshInFlight) {
      return;
    }

    this.refreshInFlight = true;
    this.loading.set(showLoading);

    try {
      const response = await firstValueFrom(this.apiService.getRadarSnapshot());
      const nextSnapshot = response.snapshot;

      this.unavailable.set(false);
      this.updatedAt.set(new Date());

      if (this.snapshot !== nextSnapshot) {
        this.snapshot = nextSnapshot;
        this.replacePrecipitationLayer();
      }
    } catch {
      this.unavailable.set(true);
    } finally {
      this.loading.set(false);
      this.refreshInFlight = false;
    }
  }

  private replacePrecipitationLayer(): void {
    const L = this.leaflet;

    if (!L || !this.map || this.snapshot === null) {
      return;
    }

    this.precipitationLayer?.remove();
    this.precipitationLayer = L.tileLayer(this.apiService.radarTileUrl(this.snapshot, this.forecastTime()), {
      attribution: 'Rainbow Weather',
      className: 'radar-precipitation-layer',
      maxZoom: 12,
      minZoom: 0,
      noWrap: true,
      opacity: this.opacity() / 100,
      tileSize: 256
    }).addTo(this.map);
  }
}
