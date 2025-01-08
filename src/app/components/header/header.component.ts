import { Component, OnInit } from '@angular/core';
import moment, { Moment } from 'moment';
import { LocationService } from '../../utils/services/location.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  public currentDate!: Moment;
  public city!: string;

  constructor(
    private locationService: LocationService
  ) { }

  ngOnInit(): void {
    this.currentDate = moment();

    this.callGetLocation();
  }

  public callGetLocation(): void {
    this.locationService.getLocation()
      .then(resp => resp.subscribe(data => {
        this.city = data.results[0].address_components[0].long_name;
      }))
      .catch((err: Error) => {
        throw err;
      });
  }
}
