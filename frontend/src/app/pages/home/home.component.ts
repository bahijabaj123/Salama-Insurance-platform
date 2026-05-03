import { ChangeDetectionStrategy, Component } from '@angular/core';

import { HomeNavbarComponent } from '../../shared/home-navbar/home-navbar.component';
import {
  MagicBentoComponent,
  type MagicBentoItem
} from '../../shared/magic-bento/magic-bento.component';
import { SilkBackgroundComponent } from '../../shared/silk/silk-background.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HomeNavbarComponent, MagicBentoComponent, SilkBackgroundComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  readonly currentYear = new Date().getFullYear();

  readonly features: MagicBentoItem[] = [
    {
      label: '01',
      title: 'Policy lifecycle',
      description: 'Create, review, and maintain contracts with structured workflows.'
    },
    {
      label: '02',
      title: 'Claims coordination',
      description: 'Track claims with evidence trails and transparent status updates.'
    },
    {
      label: '03',
      title: 'Role governance',
      description: 'Approvals and access boundaries built for regulated environments.'
    },
    {
      label: '04',
      title: 'Client workspace',
      description: 'A focused portal for insureds—simple where it should be.'
    }
  ];
}

