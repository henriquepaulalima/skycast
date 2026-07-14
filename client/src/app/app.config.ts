import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';
import { provideHttpClient } from '@angular/common/http';

registerLocaleData(localePt);

const SkycastPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f4fcff',
      100: '#e7f9ff',
      200: '#d6f4ff',
      300: '#a8e8fb',
      400: '#74d8f4',
      500: '#43c3e8',
      600: '#219bc5',
      700: '#1d7ca0',
      800: '#206783',
      900: '#1f566e',
      950: '#123848'
    },
    colorScheme: {
      dark: {
        primary: {
          color: '#d6f4ff',
          contrastColor: '#1b1d1f',
          hoverColor: '#e7f9ff',
          activeColor: '#a8e8fb'
        },
        surface: {
          0: '#f7f7f7',
          50: '#f3f3f3',
          100: '#d9dee2',
          200: '#b8c0c7',
          300: '#9aa4ad',
          400: '#6f7b85',
          500: '#56616a',
          600: '#3d4852',
          700: '#2f3943',
          800: '#20262c',
          900: '#171b1e',
          950: '#101315'
        },
        text: {
          color: '#f3f3f3',
          hoverColor: '#ffffff',
          mutedColor: '#9aa4ad',
          hoverMutedColor: '#d9dee2'
        },
        content: {
          background: '#171b1e',
          hoverBackground: '#20262c',
          borderColor: 'rgba(255,255,255,0.08)',
          color: '#f3f3f3',
          hoverColor: '#ffffff'
        },
        formField: {
          background: '#20262c',
          disabledBackground: '#171b1e',
          filledBackground: '#20262c',
          filledHoverBackground: '#252d34',
          filledFocusBackground: '#20262c',
          borderColor: 'rgba(255,255,255,0.08)',
          hoverBorderColor: '#d6f4ff',
          focusBorderColor: '#d6f4ff',
          invalidBorderColor: '#ff6b6b',
          color: '#f3f3f3',
          disabledColor: '#6f7b85',
          placeholderColor: '#9aa4ad'
        },
        highlight: {
          background: 'rgba(214,244,255,0.16)',
          focusBackground: 'rgba(214,244,255,0.24)',
          color: '#d6f4ff',
          focusColor: '#f3f3f3'
        },
        mask: {
          background: 'rgba(16,19,21,0.72)',
          color: '#f3f3f3'
        }
      }
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: SkycastPreset,
        options: {
          darkModeSelector: '[data-theme="dark"]'
        }
      }
    }),
    provideHttpClient(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
