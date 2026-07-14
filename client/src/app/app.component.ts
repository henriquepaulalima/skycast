import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppSettingsService } from './services/app-settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  public constructor() {
    inject(AppSettingsService);
  }
}
