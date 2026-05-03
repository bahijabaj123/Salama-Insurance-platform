import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';

import { AuthStorageService } from '../../core/auth/auth-storage.service';
import { ClientSidebarComponent } from './client-sidebar.component';
import { ClientTopbarComponent } from './client-topbar.component';

@Component({
  selector: 'app-client-layout',
  imports: [RouterOutlet, ClientSidebarComponent, ClientTopbarComponent],
  templateUrl: './client-layout.component.html',
  styleUrl: './client-layout.component.scss'
})
export class ClientLayoutComponent {
  private readonly router = inject(Router);
  private readonly authStorage = inject(AuthStorageService);

  readonly sidebarCollapsed = signal(false);
  readonly pageTitle = signal('Dashboard');

  constructor() {
    this.pageTitle.set(this.resolveLeafTitle(this.router.routerState.snapshot.root));

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map(() => this.resolveLeafTitle(this.router.routerState.snapshot.root)),
        takeUntilDestroyed()
      )
      .subscribe((title) => this.pageTitle.set(title));
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  onLogout(): void {
    this.authStorage.clear();
    void this.router.navigateByUrl('/login');
  }

  onNotificationsStub(): void {
    // Placeholder for a future notifications module
  }

  onSettingsStub(): void {
    // Placeholder for a future settings module
  }

  private resolveLeafTitle(root: ActivatedRouteSnapshot): string {
    let current: ActivatedRouteSnapshot = root;
    while (current.firstChild) {
      current = current.firstChild;
    }
    const title = current.data['title'];
    return typeof title === 'string' && title.trim() ? title : 'Client portal';
  }
}
