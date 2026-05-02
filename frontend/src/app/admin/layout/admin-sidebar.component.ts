import { Component, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type AdminNavItem = {
  label: string;
  path: string;
  icon: 'dashboard' | 'users' | 'requests';
};

@Component({
  selector: 'app-admin-sidebar',
    standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent {
  readonly logout = output<void>();

  readonly items: AdminNavItem[] = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Users', path: '/admin/users', icon: 'users' },
    { label: 'Role Requests', path: '/admin/role-requests', icon: 'requests' }
  ];

  onLogout(): void {
    this.logout.emit();
  }
}

