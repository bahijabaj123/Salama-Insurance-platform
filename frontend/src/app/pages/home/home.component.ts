import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HomeNavbarComponent } from '../../shared/home-navbar/home-navbar.component';
import {
  MagicBentoComponent,
  type MagicBentoItem
} from '../../shared/magic-bento/magic-bento.component';
import { SilkBackgroundComponent } from '../../shared/silk/silk-background.component';
import {
  LogoLoopComponent,
  type LogoLoopItem
} from '../../shared/logo-loop/logo-loop.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, HomeNavbarComponent, MagicBentoComponent, SilkBackgroundComponent, LogoLoopComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  readonly currentYear = new Date().getFullYear();

  readonly carBrands: LogoLoopItem[] = [
    {
      src: 'https://cdn.simpleicons.org/bmw/ffffff',
      alt: 'BMW',
      title: 'BMW',
      href: 'https://www.bmw.com'
    },
    {
      src: 'https://cdn.simpleicons.org/audi/ffffff',
      alt: 'Audi',
      title: 'Audi',
      href: 'https://www.audi.com'
    },
    {
      src: 'https://cdn.simpleicons.org/toyota/ffffff',
      alt: 'Toyota',
      title: 'Toyota',
      href: 'https://www.toyota.com'
    },
    {
      src: 'https://cdn.simpleicons.org/volkswagen/ffffff',
      alt: 'Volkswagen',
      title: 'Volkswagen',
      href: 'https://www.volkswagen.com'
    },
    {
      src: 'https://cdn.simpleicons.org/kia/ffffff',
      alt: 'Kia',
      title: 'Kia',
      href: 'https://www.kia.com'
    }
  ];

  readonly features: MagicBentoItem[] = [
    {
      label: '01',
      title: 'Instant Accident Report',
      description:
        'Report your accident quickly through a clear, guided digital form, without stressful paperwork.'
    },
    {
      label: '02',
      title: '24/7 Assistance',
      description: 'Get immediate guidance at any time and find the help you need after an accident.'
    },
    {
      label: '03',
      title: 'Secure Data Protection',
      description:
        'Your personal information, reports, and accident documents are stored safely with strong data protection.'
    },
    {
      label: '04',
      title: 'Smart Claim Tracking',
      description: 'Track your claim status step by step and stay informed throughout the entire process.'
    }
  ];
}

