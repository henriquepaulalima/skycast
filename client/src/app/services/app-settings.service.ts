import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type AppTheme = 'dark' | 'light';
export type AppLanguage = 'en' | 'pt-BR';

const STORAGE_KEY = 'skycast.settings';

const translations = {
  en: {
    selectCity: 'Select city',
    searchForLocation: 'Search for a location',
    openSettings: 'Open settings',
    loadingWeather: 'Loading weather',
    currentWeather: 'Current weather',
    wind: 'Wind',
    humidity: 'Humidity',
    rain: 'Rain',
    rainRadar: 'Rain radar',
    openRainMap: 'Open map',
    recenterMap: 'Recenter',
    liveRadar: 'Live',
    radarForecast30: '+30m',
    radarForecast60: '+1h',
    radarLoading: 'Loading radar...',
    radarUnavailable: 'Radar is unavailable.',
    radarOpacity: 'Radar opacity',
    radarUpdated: 'Updated',
    today: 'Today',
    tomorrow: 'Tomorrow',
    week: 'Week',
    noHourlyData: 'No hourly data available.',
    chooseCity: 'Choose a city',
    chooseCityDescription: 'Search for a city to see the forecast.',
    searchCity: 'Search city',
    attribution: 'Weather data by Open-Meteo.',
    selectCityHeader: 'Select city',
    currentLocation: 'Current location',
    unsaveCurrentCity: 'Unsave current city',
    saveCurrentCity: 'Save current city',
    noCitySelected: 'No city selected',
    searchBelow: 'Search below to choose a city.',
    search: 'Search',
    saved: 'Saved',
    searchPlaceholder: 'Search city or postal code',
    searchingCities: 'Searching cities...',
    unsaveCity: 'Unsave city',
    saveCity: 'Save city',
    typeAtLeastTwo: 'Type at least two characters to search.',
    savedCitiesEmpty: 'Saved cities will appear here.',
    settings: 'Settings',
    dynamicBackground: 'Dynamic background',
    dynamicBackgroundDescription: 'Use light mode from 6:00 to 18:00 and dark mode from 18:00 to 6:00.',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    enabled: 'Enabled',
    disabled: 'Disabled',
    language: 'Language',
    english: 'English',
    portuguese: 'Brazilian Portuguese',
    clearSavedLocations: 'Clear saved locations',
    clearingSavedLocations: 'Clearing saved locations...',
    noSavedCitiesAlert: 'No cities are saved.',
    installApp: 'Install app',
    installAppDescription: 'Install Skycast on this device for quick access.',
    installAppButton: 'Install Skycast',
    installAppFallback: 'If the button is unavailable, open the browser menu and choose Add to Home screen.',
    appInstalled: 'Skycast is installed on this device.',
    locationUnavailable: 'Location is unavailable in this browser. Search for a city to continue.',
    locationDenied: 'Location permission was denied. Search for a city to continue.',
    unableToLoadWeather: 'Unable to load weather for this location.',
    weekForecast: 'Week forecast',
    nextSevenDays: 'Next 7 days',
    noForecastSelected: 'No forecast selected',
    chooseCityHomeFirst: 'Choose a city on the home screen first.',
    goHome: 'Go home',
    dayDetails: 'Day details',
    temperature: 'Temperature',
    back: 'Back'
  },
  'pt-BR': {
    selectCity: 'Selecionar cidade',
    searchForLocation: 'Busque uma localização',
    openSettings: 'Abrir configurações',
    loadingWeather: 'Carregando clima',
    currentWeather: 'Clima atual',
    wind: 'Vento',
    humidity: 'Umidade',
    rain: 'Chuva',
    rainRadar: 'Radar de chuva',
    openRainMap: 'Abrir mapa',
    recenterMap: 'Recentralizar',
    liveRadar: 'Ao vivo',
    radarForecast30: '+30min',
    radarForecast60: '+1h',
    radarLoading: 'Carregando radar...',
    radarUnavailable: 'Radar indisponível.',
    radarOpacity: 'Opacidade do radar',
    radarUpdated: 'Atualizado',
    today: 'Hoje',
    tomorrow: 'Amanhã',
    week: 'Semana',
    noHourlyData: 'Nenhum dado por hora disponível.',
    chooseCity: 'Escolha uma cidade',
    chooseCityDescription: 'Busque uma cidade para ver a previsão.',
    searchCity: 'Buscar cidade',
    attribution: 'Dados climáticos por Open-Meteo.',
    selectCityHeader: 'Selecionar cidade',
    currentLocation: 'Localização atual',
    unsaveCurrentCity: 'Remover cidade atual',
    saveCurrentCity: 'Salvar cidade atual',
    noCitySelected: 'Nenhuma cidade selecionada',
    searchBelow: 'Busque abaixo para escolher uma cidade.',
    search: 'Buscar',
    saved: 'Salvas',
    searchPlaceholder: 'Buscar cidade ou CEP',
    searchingCities: 'Buscando cidades...',
    unsaveCity: 'Remover cidade',
    saveCity: 'Salvar cidade',
    typeAtLeastTwo: 'Digite pelo menos dois caracteres para buscar.',
    savedCitiesEmpty: 'Cidades salvas aparecerão aqui.',
    settings: 'Configurações',
    dynamicBackground: 'Plano de fundo dinâmico',
    dynamicBackgroundDescription: 'Usa modo claro das 6:00 às 18:00 e modo escuro das 18:00 às 6:00.',
    theme: 'Tema',
    dark: 'Escuro',
    light: 'Claro',
    enabled: 'Ativado',
    disabled: 'Desativado',
    language: 'Idioma',
    english: 'Inglês',
    portuguese: 'Português brasileiro',
    clearSavedLocations: 'Limpar locais salvos',
    clearingSavedLocations: 'Limpando locais salvos...',
    noSavedCitiesAlert: 'Nenhuma cidade está salva.',
    installApp: 'Instalar app',
    installAppDescription: 'Instale o Skycast neste dispositivo para acesso rápido.',
    installAppButton: 'Instalar Skycast',
    installAppFallback: 'Se o botão não aparecer, abra o menu do navegador e escolha Adicionar à tela inicial.',
    appInstalled: 'O Skycast está instalado neste dispositivo.',
    locationUnavailable: 'A localização não está disponível neste navegador. Busque uma cidade para continuar.',
    locationDenied: 'A permissão de localização foi negada. Busque uma cidade para continuar.',
    unableToLoadWeather: 'Não foi possível carregar o clima para esta localização.',
    weekForecast: 'Previsão semanal',
    nextSevenDays: 'Próximos 7 dias',
    noForecastSelected: 'Nenhuma previsão selecionada',
    chooseCityHomeFirst: 'Escolha uma cidade na tela inicial primeiro.',
    goHome: 'Ir para início',
    dayDetails: 'Detalhes do dia',
    temperature: 'Temperatura',
    back: 'Voltar'
  }
} as const;

type TranslationKey = keyof typeof translations.en;

const weatherDescriptions: Record<string, Record<string, string>> = {
  'Clear sky': { en: 'Clear sky', 'pt-BR': 'Céu limpo' },
  'Partly cloudy': { en: 'Partly cloudy', 'pt-BR': 'Parcialmente nublado' },
  Overcast: { en: 'Overcast', 'pt-BR': 'Nublado' },
  Fog: { en: 'Fog', 'pt-BR': 'Nevoeiro' },
  Drizzle: { en: 'Drizzle', 'pt-BR': 'Garoa' },
  Rain: { en: 'Rain', 'pt-BR': 'Chuva' },
  Snow: { en: 'Snow', 'pt-BR': 'Neve' },
  Thunderstorm: { en: 'Thunderstorm', 'pt-BR': 'Tempestade' },
  Unknown: { en: 'Unknown', 'pt-BR': 'Desconhecido' }
};

interface StoredSettings {
  theme?: AppTheme;
  language?: AppLanguage;
  dynamicBackground?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppSettingsService {
  private readonly document = inject(DOCUMENT);

  private readonly settings = signal(this.readSettings());
  private readonly currentTime = signal(new Date());

  public readonly theme = computed(() => {
    if (!this.dynamicBackground()) {
      return this.settings().theme;
    }

    return this.resolveDynamicTheme(this.currentTime());
  });
  public readonly language = computed(() => this.settings().language);
  public readonly dynamicBackground = computed(() => this.settings().dynamicBackground);
  public readonly dateLocale = computed(() => this.language() === 'pt-BR' ? 'pt-BR' : 'en-US');

  public constructor() {
    effect(() => {
      this.document.documentElement.dataset['theme'] = this.theme();
      this.document.documentElement.lang = this.language();
    });

    effect((onCleanup) => {
      if (!this.dynamicBackground()) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        this.currentTime.set(new Date());
      }, this.msUntilNextThemeChange(this.currentTime()));

      onCleanup(() => window.clearTimeout(timeoutId));
    });
  }

  public setTheme(theme: AppTheme): void {
    this.update({ theme });
  }

  public setLanguage(language: AppLanguage): void {
    this.update({ language });
  }

  public setDynamicBackground(dynamicBackground: boolean): void {
    this.currentTime.set(new Date());
    this.update({ dynamicBackground });
  }

  public t(key: TranslationKey): string {
    return translations[this.language()][key];
  }

  public showAllResultsLabel(): string {
    return this.language() === 'pt-BR' ? 'Mostrar todos os resultados' : 'Show all results';
  }

  public weatherDescription(description: string): string {
    return weatherDescriptions[description]?.[this.language()] ?? description;
  }

  public dayLabel(date: string, index?: number): string {
    if (index === 0) {
      return this.t('today');
    }

    return new Intl.DateTimeFormat(this.dateLocale(), { weekday: 'long' }).format(new Date(`${date}T12:00:00`));
  }

  private update(settings: Partial<StoredSettings>): void {
    const nextSettings = { ...this.settings(), ...settings };

    this.settings.set(nextSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
  }

  private readSettings(): Required<StoredSettings> {
    const defaults: Required<StoredSettings> = {
      theme: 'dark',
      language: 'en',
      dynamicBackground: false
    };
    const rawSettings = localStorage.getItem(STORAGE_KEY);

    if (!rawSettings) {
      return defaults;
    }

    try {
      const parsedSettings = JSON.parse(rawSettings) as StoredSettings;

      return {
        theme: parsedSettings.theme === 'light' ? 'light' : defaults.theme,
        language: parsedSettings.language === 'pt-BR' ? 'pt-BR' : defaults.language,
        dynamicBackground: parsedSettings.dynamicBackground === true
      };
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return defaults;
    }
  }

  private resolveDynamicTheme(currentTime: Date): AppTheme {
    const hour = currentTime.getHours();

    return hour >= 6 && hour < 18 ? 'light' : 'dark';
  }

  private msUntilNextThemeChange(currentTime: Date): number {
    const nextChange = new Date(currentTime);
    const hour = currentTime.getHours();

    if (hour < 6) {
      nextChange.setHours(6, 0, 0, 0);
    } else if (hour < 18) {
      nextChange.setHours(18, 0, 0, 0);
    } else {
      nextChange.setDate(nextChange.getDate() + 1);
      nextChange.setHours(6, 0, 0, 0);
    }

    return Math.max(nextChange.getTime() - currentTime.getTime(), 1);
  }
}
