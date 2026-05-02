import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type NavItem = {
  label: string;
  path: string;
  icon: 'dashboard' | 'contract' | 'history' | 'claims' | 'profile';
};

@Component({
  selector: 'app-client-sidebar',
    standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './client-sidebar.component.html',
  styleUrl: './client-sidebar.component.scss'
})
export class ClientSidebarComponent {
  readonly collapsed = input(false);

  readonly logout = output<void>();

  readonly items: NavItem[] = [
    { label: 'Dashboard', path: '/client/dashboard', icon: 'dashboard' },
    { label: 'Create Contract', path: '/client/create-contract', icon: 'contract' },
    { label: 'History', path: '/client/history', icon: 'history' },
    { label: 'Claims', path: '/client/claims', icon: 'claims' },
    { label: 'Profile', path: '/client/profile', icon: 'profile' }
  ];

  onLogout(): void {
    this.logout.emit();
  }
}
