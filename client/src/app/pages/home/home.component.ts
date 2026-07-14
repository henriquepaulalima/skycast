import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { debounceTime, distinctUntilChanged, finalize, firstValueFrom, of, switchMap, tap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { CityLocation, DayWeather, HourWeather } from '../../models/weather.models';
import { ApiService } from '../../services/api.service';
import { AppLanguage, AppSettingsService, AppTheme } from '../../services/app-settings.service';
import { SavedCitiesService } from '../../services/saved-cities.service';
import { WeatherIconService } from '../../services/weather-icon.service';
import { WeatherStateService } from '../../services/weather-state.service';
import { RainRadarMapComponent } from './rain-radar-map.component';

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    DatePipe,
    DialogModule,
    FontAwesomeModule,
    InputTextModule,
    ProgressSpinnerModule,
    ReactiveFormsModule,
    RainRadarMapComponent,
    TabViewModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private readonly appSettings = inject(AppSettingsService);
  private readonly messageService = inject(MessageService);
  private readonly savedCitiesService = inject(SavedCitiesService);
  private readonly weatherIcons = inject(WeatherIconService);
  private readonly weatherState = inject(WeatherStateService);

  public readonly citySearch = new FormControl('', { nonNullable: true });
  public readonly searchResults = signal<CityLocation[]>([]);
  public readonly citySearchLoading = signal(false);
  public readonly clearingSavedCities = signal(false);
  public readonly showAllSearchResults = signal(false);
  public readonly modalVisible = signal(false);
  public readonly configModalVisible = signal(false);
  public readonly weekModalVisible = signal(false);
  public readonly selectedDay = signal<DayWeather | null>(null);
  public readonly installPromptAvailable = signal(false);
  public readonly installedAsPwa = signal(false);
  public readonly permissionMessage = signal<Parameters<AppSettingsService['t']>[0] | null>(null);
  public readonly activeTimeline = signal<'today' | 'tomorrow'>('today');
  public readonly savedCities = this.savedCitiesService.savedCities;
  public readonly icons = this.weatherIcons.uiIcons;
  public readonly forecast = this.weatherState.forecast;
  public readonly loading = this.weatherState.loading;
  public readonly error = this.weatherState.error;
  public readonly theme = this.appSettings.theme;
  public readonly language = this.appSettings.language;
  public readonly dynamicBackground = this.appSettings.dynamicBackground;
  public readonly dateLocale = this.appSettings.dateLocale;
  public readonly currentCards = computed(() => {
    const forecast = this.forecast();

    if (!forecast) {
      return [];
    }

    return [
      { label: this.t('wind'), value: `${Math.round(forecast.current.windSpeed)} km/h`, icon: this.icons.wind, color: this.theme() === 'light' ? '#b4cbe6' : '#f1f1e6' },
      { label: this.t('humidity'), value: `${Math.round(forecast.current.humidity)}%`, icon: this.icons.humidity, color: '#00b7ff' },
      { label: this.t('rain'), value: `${Math.round(forecast.current.rainProbability)}%`, icon: this.icons.rain, color: '#516880' }
    ];
  });
  public readonly visibleHours = computed<HourWeather[]>(() => {
    const forecast = this.forecast();

    if (!forecast) {
      return [];
    }

    return this.activeTimeline() === 'today' ? forecast.today : forecast.tomorrow;
  });
  public readonly visibleSearchResults = computed(() => {
    return this.searchResults();
  });

  public ngOnInit(): void {
    this.bindInstallPrompt();
    this.bindCitySearch();

    if (!this.forecast()) {
      void this.loadCurrentPosition();
    }
  }

  public ngOnDestroy(): void {
    window.removeEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.removeEventListener('appinstalled', this.handleAppInstalled);
  }

  public weatherIcon(weatherCode: number, time?: string) {
    return this.weatherIcons.getWeatherIcon(weatherCode, time);
  }

  public weatherIconColor(weatherCode: number, time?: string): string {
    return this.weatherIcons.getWeatherIconColor(weatherCode, time);
  }

  public dayLabel(day: DayWeather, index?: number): string {
    if (day.date === this.forecast()?.week[0]?.date) {
      return this.t('today');
    }

    return this.appSettings.dayLabel(day.date, index);
  }

  public t(key: Parameters<AppSettingsService['t']>[0]): string {
    return this.appSettings.t(key);
  }

  public weatherDescription(description: string): string {
    return this.appSettings.weatherDescription(description);
  }

  public weatherError(message: string): string {
    return message === 'Unable to load weather for this location.' ? this.t('unableToLoadWeather') : message;
  }

  public showAllResultsLabel(): string {
    return this.appSettings.showAllResultsLabel();
  }

  public setTheme(theme: AppTheme): void {
    this.appSettings.setTheme(theme);
  }

  public setLanguage(language: AppLanguage): void {
    this.appSettings.setLanguage(language);
  }

  public setDynamicBackground(dynamicBackground: boolean): void {
    this.appSettings.setDynamicBackground(dynamicBackground);
  }

  public async selectCity(city: CityLocation): Promise<void> {
    this.modalVisible.set(false);
    await this.weatherState.selectLocation(city);
  }

  public saveCity(city: CityLocation): void {
    this.savedCitiesService.save(city);
  }

  public removeCity(city: CityLocation): void {
    this.savedCitiesService.remove(city);
  }

  public isSaved(city: CityLocation): boolean {
    return this.savedCitiesService.isSaved(city);
  }

  public openWeek(): void {
    this.weekModalVisible.set(true);
  }

  public setWeekModalVisible(visible: boolean): void {
    this.weekModalVisible.set(visible);

    if (!visible) {
      this.selectedDay.set(null);
    }
  }

  public async showAllCities(): Promise<void> {
    const query = this.citySearch.value.trim();

    if (query.length < 2 || this.citySearchLoading()) {
      return;
    }

    this.citySearchLoading.set(true);
    this.showAllSearchResults.set(true);

    try {
      const cities = await firstValueFrom(this.apiService.searchCities(query, 10));

      this.searchResults.set(cities);
    } finally {
      this.citySearchLoading.set(false);
    }
  }

  public async clearSavedLocations(): Promise<void> {
    if (this.clearingSavedCities()) {
      return;
    }

    if (this.savedCities().length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: this.t('settings'),
        detail: this.t('noSavedCitiesAlert')
      });
      return;
    }

    this.clearingSavedCities.set(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));
    this.savedCitiesService.clear();
    this.clearingSavedCities.set(false);
  }

  public async installApp(): Promise<void> {
    if (!this.deferredInstallPrompt) {
      return;
    }

    const prompt = this.deferredInstallPrompt;

    this.deferredInstallPrompt = null;
    this.installPromptAvailable.set(false);

    await prompt.prompt();
    const choice = await prompt.userChoice;

    if (choice.outcome === 'accepted') {
      this.installedAsPwa.set(true);
    }
  }

  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

  private readonly handleBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    this.deferredInstallPrompt = event as BeforeInstallPromptEvent;
    this.installPromptAvailable.set(true);
  };

  private readonly handleAppInstalled = (): void => {
    this.deferredInstallPrompt = null;
    this.installPromptAvailable.set(false);
    this.installedAsPwa.set(true);
  };

  private bindInstallPrompt(): void {
    this.installedAsPwa.set(this.isRunningStandalone());
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', this.handleAppInstalled);
  }

  private isRunningStandalone(): boolean {
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };

    return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
  }

  private bindCitySearch(): void {
    this.citySearch.valueChanges.pipe(
      tap((query) => {
        if (query.trim().length < 2) {
          this.citySearchLoading.set(false);
          this.showAllSearchResults.set(false);
          this.searchResults.set([]);
        }
      }),
      debounceTime(1000),
      distinctUntilChanged(),
      switchMap((query) => {
        const trimmedQuery = query.trim();

        if (trimmedQuery.length < 2) {
          return of([]);
        }

        this.citySearchLoading.set(true);

        return this.apiService.searchCities(trimmedQuery, 5).pipe(
          finalize(() => this.citySearchLoading.set(false))
        );
      })
    ).subscribe((cities) => {
      if (this.citySearch.value.trim().length < 2) {
        this.searchResults.set([]);
        return;
      }

      this.showAllSearchResults.set(false);
      this.searchResults.set(cities);
    });
  }

  private async loadCurrentPosition(): Promise<void> {
    if (!navigator.geolocation) {
      this.permissionMessage.set('locationUnavailable');
      return;
    }

    try {
      const coords = await this.getBrowserCoords();
      const location = await firstValueFrom(this.apiService.reverseLocation(coords.latitude, coords.longitude));

      await this.weatherState.selectLocation(location);
    } catch {
      this.permissionMessage.set('locationDenied');
    }
  }

  private getBrowserCoords(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        reject,
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
}
