import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStorageService } from '../../auth/auth-storage.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="logout-container">
      <mat-spinner diameter="40"></mat-spinner>
      <p>Déconnexion en cours...</p>
    </div>
  `,
  styles: [`
    .logout-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 16px;
    }
  `]
})
export class LogoutComponent implements OnInit {
  constructor(
    private authStorage: AuthStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authStorage.clear();
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 500);
  }
}
