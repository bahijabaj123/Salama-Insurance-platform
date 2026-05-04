import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthStorageService } from '../../../core/auth/auth-storage.service';

@Component({
  selector: 'app-client-dashboard',
    standalone: true,
  imports: [RouterLink],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.scss'
})
export class ClientDashboardComponent {
  private readonly authStorage = inject(AuthStorageService);

  readonly user = computed(() => this.authStorage.getUser());

  readonly quickLinks = [
    { label: 'Create Contract', description: 'Start a new policy workflow', path: '/client/create-contract' },
    { label: 'View History', description: 'Review past contracts and actions', path: '/client/history' },
    { label: 'View Claims', description: 'Track and manage your claims', path: '/client/claims' },
    { label: 'Open Profile', description: 'Update your personal details', path: '/client/profile' },
    { label: 'Open Profile', description: 'Update your personal details', path: '/client/profile' },
    { label: 'Nouveau constat', description: 'Déclarer un accident en ligne', path: '/accident' } 

  ] as const;
}
