import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-client-topbar',
  imports: [],
  templateUrl: './client-topbar.component.html',
  styleUrl: './client-topbar.component.scss'
})
export class ClientTopbarComponent {
  readonly collapsed = input(false);
  readonly pageTitle = input('Dashboard');

  readonly toggleSidebar = output<void>();
  readonly notificationsClick = output<void>();
  readonly settingsClick = output<void>();

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  onNotifications(): void {
    this.notificationsClick.emit();
  }

  onSettings(): void {
    this.settingsClick.emit();
  }
}
