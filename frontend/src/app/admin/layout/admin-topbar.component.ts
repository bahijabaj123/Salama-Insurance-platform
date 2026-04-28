import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-topbar',
  imports: [RouterLink],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss'
})
export class AdminTopbarComponent {
  readonly pageTitle = input('Dashboard');
  readonly identity = input<{ initials: string; name: string } | null>(null);

  readonly notificationsClick = output<void>();
  readonly settingsClick = output<void>();

  onNotifications(): void {
    this.notificationsClick.emit();
  }

  onSettings(): void {
    this.settingsClick.emit();
  }
}

