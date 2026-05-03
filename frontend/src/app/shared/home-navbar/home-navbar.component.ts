import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home-navbar.component.html',
  styleUrl: './home-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeNavbarComponent {}
