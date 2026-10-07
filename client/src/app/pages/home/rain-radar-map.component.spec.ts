import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppSettingsService } from '../../services/app-settings.service';
import { RainRadarMapComponent } from './rain-radar-map.component';

describe('RainRadarMapComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [RainRadarMapComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  it('translates its own labels in both languages', () => {
    const component = TestBed.createComponent(RainRadarMapComponent).componentInstance;

    expect(component.t('rainRadar')).toBe('Rain radar');
    TestBed.inject(AppSettingsService).setLanguage('pt-BR');
    expect(component.t('rainRadar')).toBe('Radar de chuva');
    expect(component.t('unknownKey')).toBe('unknownKey');
  });

  it('switches forecast time and opacity', () => {
    const component = TestBed.createComponent(RainRadarMapComponent).componentInstance;
    const input = document.createElement('input');

    component.setForecastTime(1800);
    input.value = '40';
    component.setOpacityFromEvent({ target: input } as unknown as Event);
    input.value = 'abc';
    component.setOpacityFromEvent({ target: input } as unknown as Event);

    expect(component.forecastTime()).toBe(1800);
    expect(component.opacity()).toBe(40);
  });
});
