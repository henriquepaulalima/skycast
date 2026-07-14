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
});
