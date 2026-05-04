import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { filter, map } from 'rxjs/operators';

import { AuthStorageService } from '../../core/auth/auth-storage.service';
import type { LoggedUser } from '../../core/auth/login.models';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminTopbarComponent } from './admin-topbar.component';

@Component({
  selector: 'app-admin-layout',
   standalone: true,
  imports: [RouterOutlet, AdminSidebarComponent, AdminTopbarComponent, MatSidenavModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  private readonly router = inject(Router);
  private readonly authStorage = inject(AuthStorageService);

  readonly pageTitle = signal('Dashboard');
  readonly identity = signal<{ initials: string; name: string } | null>(null);
  readonly sidenavOpen = signal(true);

  constructor() {
    const user = this.authStorage.getUser();
    this.identity.set(this.buildIdentity(user));

    this.pageTitle.set(this.resolveLeafTitle(this.router.routerState.snapshot.root));
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map(() => this.resolveLeafTitle(this.router.routerState.snapshot.root)),
        takeUntilDestroyed()
      )
      .subscribe((title) => this.pageTitle.set(title));
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
    return typeof title === 'string' && title.trim() ? title : 'Admin console';
  }

  private buildIdentity(user: LoggedUser | null): { initials: string; name: string } | null {
    if (!user) {
      return null;
    }
    const name = user.fullName?.trim() || user.email;
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
    return { initials: initials || 'A', name };
  }
}

