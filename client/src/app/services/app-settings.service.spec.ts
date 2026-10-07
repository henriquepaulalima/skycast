import { TestBed } from '@angular/core/testing';
import { AppSettingsService } from './app-settings.service';

describe('AppSettingsService', () => {
  beforeEach(() => {
    localStorage.clear();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('uses light theme during the day when dynamic background is enabled', () => {
    jasmine.clock().mockDate(new Date('2026-07-14T10:00:00'));
    TestBed.configureTestingModule({});
    const service = TestBed.inject(AppSettingsService);

    service.setDynamicBackground(true);

    expect(service.dynamicBackground()).toBeTrue();
    expect(service.theme()).toBe('light');
  });

  it('uses dark theme at night when dynamic background is enabled', () => {
    jasmine.clock().mockDate(new Date('2026-07-14T19:00:00'));
    TestBed.configureTestingModule({});
    const service = TestBed.inject(AppSettingsService);

    service.setDynamicBackground(true);

    expect(service.theme()).toBe('dark');
  });

  it('preserves the manual theme preference while dynamic background is disabled', () => {
    jasmine.clock().mockDate(new Date('2026-07-14T10:00:00'));
    TestBed.configureTestingModule({});
    const service = TestBed.inject(AppSettingsService);

    service.setTheme('light');
    service.setDynamicBackground(true);
    service.setDynamicBackground(false);

    expect(service.theme()).toBe('light');
  });

  it('translates labels and weather descriptions into Brazilian Portuguese', () => {
    const service = TestBed.inject(AppSettingsService);

    expect(service.t('settings')).toBe('Settings');
    service.setLanguage('pt-BR');

    expect(service.t('settings')).toBe('Configurações');
    expect(service.weatherDescription('Rain')).toBe('Chuva');
    expect(service.weatherDescription('Something new')).toBe('Something new');
    expect(service.dateLocale()).toBe('pt-BR');
    TestBed.flushEffects();
    expect(document.documentElement.lang).toBe('pt-BR');
  });

  it('remembers settings and ignores invalid stored values', () => {
    localStorage.setItem('skycast.settings', JSON.stringify({ theme: 'purple', language: 'fr', dynamicBackground: 'yes' }));
    const service = TestBed.inject(AppSettingsService);

    expect(service.theme()).toBe('dark');
    expect(service.language()).toBe('en');
    expect(service.dynamicBackground()).toBeFalse();

    service.setTheme('light');
    expect(JSON.parse(localStorage.getItem('skycast.settings') ?? '{}').theme).toBe('light');
  });

  it('labels the first day as today', () => {
    const service = TestBed.inject(AppSettingsService);

    expect(service.dayLabel('2026-10-07', 0)).toBe('Today');
    expect(service.dayLabel('2026-10-08', 1)).toBe('Thursday');
  });
});

