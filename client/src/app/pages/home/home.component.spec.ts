import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { CityLocation, WeatherForecast } from '../../models/weather.models';
import { ApiService } from '../../services/api.service';
import { SavedCitiesService } from '../../services/saved-cities.service';
import { WeatherStateService } from '../../services/weather-state.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  const rio: CityLocation = { id: 1, name: 'Rio de Janeiro', latitude: -22.9, longitude: -43.2, timezone: 'America/Sao_Paulo' };
  const forecast: WeatherForecast = {
    location: rio,
    current: { time: '2026-10-07T10:00', temperature: 25.4, windSpeed: 12.6, humidity: 70.2, rainProbability: 39.5, weatherCode: 3, description: 'Overcast' },
    today: [{ time: '2026-10-07T11:00', hourLabel: '11 AM', temperature: 26, weatherCode: 3, description: 'Overcast' }],
    tomorrow: [{ time: '2026-10-08T11:00', hourLabel: '11 AM', temperature: 22, weatherCode: 61, description: 'Rain' }],
    week: [{ date: '2026-10-07', dayLabel: 'Today', minTemperature: 20, maxTemperature: 27, windSpeed: 15, humidity: 70, rainProbability: 40, weatherCode: 3, description: 'Overcast' }]
  };
  let api: jasmine.SpyObj<ApiService>;
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;

  function geolocation(behavior: 'grant' | 'deny') {
    spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake((success, error) => {
      if (behavior === 'grant') success({ coords: { latitude: -22.9, longitude: -43.2 } } as GeolocationPosition);
      else error?.({ code: 1, message: 'denied' } as GeolocationPositionError);
    });
  }

  function render() {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.clear();
    api = jasmine.createSpyObj<ApiService>('ApiService', ['searchCities', 'reverseLocation', 'getForecast']);
    api.getForecast.and.returnValue(of(forecast));
    api.reverseLocation.and.returnValue(of(rio));
    api.searchCities.and.returnValue(of([rio]));
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideNoopAnimations(), MessageService, { provide: ApiService, useValue: api }]
    });
  });

  it('loads the forecast for the current position on start', fakeAsync(() => {
    geolocation('grant');
    render();
    flushMicrotasks();
    fixture.detectChanges();

    expect(api.reverseLocation).toHaveBeenCalledWith(-22.9, -43.2);
    expect(component.forecast()).toEqual(forecast);
    expect(fixture.nativeElement.textContent).toContain('Rio de Janeiro');
  }));

  it('asks for a city when location permission is denied', fakeAsync(() => {
    geolocation('deny');
    render();
    flushMicrotasks();
    fixture.detectChanges();

    expect(component.permissionMessage()).toBe('locationDenied');
    expect(fixture.nativeElement.textContent).toContain('Location permission was denied');
  }));

  it('does not request the position again when a forecast is already loaded', fakeAsync(() => {
    geolocation('grant');
    void TestBed.inject(WeatherStateService).selectLocation(rio);
    flushMicrotasks();
    api.reverseLocation.calls.reset();

    render();
    flushMicrotasks();

    expect(api.reverseLocation).not.toHaveBeenCalled();
  }));

  it('summarizes current conditions as rounded cards', fakeAsync(() => {
    geolocation('grant');
    render();
    flushMicrotasks();

    expect(component.currentCards().map((card) => card.value)).toEqual(['13 km/h', '70%', '40%']);
  }));

  it('switches the hourly timeline between today and tomorrow', fakeAsync(() => {
    geolocation('grant');
    render();
    flushMicrotasks();

    expect(component.visibleHours()).toEqual(forecast.today);
    component.activeTimeline.set('tomorrow');
    expect(component.visibleHours()).toEqual(forecast.tomorrow);
  }));

  it('searches cities one second after typing stops, ignoring short queries', fakeAsync(() => {
    geolocation('deny');
    render();

    component.citySearch.setValue('r');
    tick(1000);
    expect(api.searchCities).not.toHaveBeenCalled();

    component.citySearch.setValue('ri');
    tick(500);
    component.citySearch.setValue('rio');
    tick(1000);

    expect(api.searchCities).toHaveBeenCalledOnceWith('rio', 5);
    expect(component.searchResults()).toEqual([rio]);
    expect(component.citySearchLoading()).toBeFalse();
  }));

  it('clears results when the query becomes too short', fakeAsync(() => {
    geolocation('deny');
    render();
    component.citySearch.setValue('rio');
    tick(1000);

    component.citySearch.setValue('r');
    tick(1000);

    expect(component.searchResults()).toEqual([]);
  }));

  it('shows up to ten results on request', fakeAsync(() => {
    geolocation('deny');
    render();
    component.citySearch.setValue('rio');

    void component.showAllCities();
    flushMicrotasks();

    expect(api.searchCities).toHaveBeenCalledWith('rio', 10);
    expect(component.showAllSearchResults()).toBeTrue();
    tick(1000);
  }));

  it('selects a city and closes the city dialog', fakeAsync(() => {
    geolocation('deny');
    render();
    component.modalVisible.set(true);

    void component.selectCity(rio);
    flushMicrotasks();

    expect(component.modalVisible()).toBeFalse();
    expect(api.getForecast).toHaveBeenCalledWith(rio);
  }));

  it('shows an error when the forecast cannot load', fakeAsync(() => {
    geolocation('deny');
    api.getForecast.and.returnValue(throwError(() => new Error('down')));
    render();

    void component.selectCity(rio);
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unable to load weather for this location.');
  }));

  it('saves and removes cities', fakeAsync(() => {
    geolocation('deny');
    render();

    component.saveCity(rio);
    expect(component.isSaved(rio)).toBeTrue();
    component.removeCity(rio);
    expect(component.isSaved(rio)).toBeFalse();
  }));

  it('clears saved cities after a short delay, or explains there are none', fakeAsync(() => {
    geolocation('deny');
    render();
    // The component provides its own MessageService for its toast.
    const messages = fixture.debugElement.injector.get(MessageService);
    spyOn(messages, 'add');

    void component.clearSavedLocations();
    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'info', detail: 'No cities are saved.' }));

    TestBed.inject(SavedCitiesService).save(rio);
    void component.clearSavedLocations();
    expect(component.clearingSavedCities()).toBeTrue();
    tick(2000);

    expect(component.savedCities()).toEqual([]);
    expect(component.clearingSavedCities()).toBeFalse();
  }));

  it('offers installation when the browser allows it and records acceptance', fakeAsync(() => {
    geolocation('deny');
    render();
    const prompt = new Event('beforeinstallprompt', { cancelable: true }) as Event & { prompt: jasmine.Spy; userChoice: Promise<unknown> };
    prompt.prompt = jasmine.createSpy('prompt').and.resolveTo();
    prompt.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });

    window.dispatchEvent(prompt);
    expect(prompt.defaultPrevented).toBeTrue();
    expect(component.installPromptAvailable()).toBeTrue();

    void component.installApp();
    flushMicrotasks();

    expect(prompt.prompt).toHaveBeenCalled();
    expect(component.installedAsPwa()).toBeTrue();
    expect(component.installPromptAvailable()).toBeFalse();
  }));

  it('stops listening for install events when destroyed', fakeAsync(() => {
    geolocation('deny');
    render();
    fixture.destroy();

    window.dispatchEvent(new Event('beforeinstallprompt'));

    expect(component.installPromptAvailable()).toBeFalse();
  }));

  it('closes the week dialog and clears the selected day', fakeAsync(() => {
    geolocation('deny');
    render();
    component.openWeek();
    component.selectedDay.set(forecast.week[0]);

    component.setWeekModalVisible(false);

    expect(component.weekModalVisible()).toBeFalse();
    expect(component.selectedDay()).toBeNull();
  }));

  it('never renders the radar map', fakeAsync(() => {
    geolocation('grant');
    render();
    flushMicrotasks();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-rain-radar-map')).toBeNull();
    expect(fixture.nativeElement.textContent.toLowerCase()).not.toContain('radar');
  }));
});
