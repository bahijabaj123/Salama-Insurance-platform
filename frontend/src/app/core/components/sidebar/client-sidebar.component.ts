import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-client-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="client-sidebar">
      <div class="logo">
        <i class="fas fa-shield-alt"></i>
        <span>Salama</span>
      </div>

      <nav>
        <a routerLink="/client/dashboard" routerLinkActive="active">
          <i class="fas fa-chart-line"></i> Tableau de bord
        </a>
        <a routerLink="/client/claims" routerLinkActive="active">
          <i class="fas fa-file-alt"></i> Mes sinistres
          <span class="badge">3</span>
        </a>
        <a routerLink="/client/constat" routerLinkActive="active">
          <i class="fas fa-plus-circle"></i> Nouveau constat
        </a>
        <a routerLink="/client/sos" routerLinkActive="active">
          <i class="fas fa-life-ring"></i> SOS disponible
        </a>
        <a routerLink="/client/contract" routerLinkActive="active">
          <i class="fas fa-file-signature"></i> Mon contrat
        </a>
        <a routerLink="/client/documents" routerLinkActive="active">
          <i class="fas fa-folder-open"></i> Documents
        </a>
        <a routerLink="/client/notifications" routerLinkActive="active">
          <i class="fas fa-bell"></i> Notifications
          <span class="badge">15</span>
        </a>

        <div class="support-title">SUPPORT</div>
        <a routerLink="/client/assistant" routerLinkActive="active">
          <i class="fas fa-robot"></i> Assistant IA
        </a>
        <a routerLink="/client/faq" routerLinkActive="active">
          <i class="fas fa-question-circle"></i> FAQ
        </a>
      </nav>

      <div class="user-info">
        <img src="assets/avatar.png" alt="Avatar" />
        <div>
          <div class="name">Ahmed Ben Ali</div>
          <div class="role">Client actif</div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .client-sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 260px;
      height: 100vh;
      background: linear-gradient(180deg, #0a2b44 0%, #0e3d6b 100%);
      color: white;
      display: flex;
      flex-direction: column;
      padding: 24px 16px;
      z-index: 1000;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 32px;
    }
    .logo i { font-size: 28px; }
    nav a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      margin: 4px 0;
      border-radius: 12px;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      transition: all 0.2s;
    }
    nav a:hover, nav a.active {
      background: rgba(255,255,255,0.1);
      color: white;
    }
    .badge {
      margin-left: auto;
      background: #ff8c00;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 20px;
    }
    .support-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 24px 0 8px 12px;
      color: rgba(255,255,255,0.5);
    }
    .user-info {
      margin-top: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .user-info img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
    .user-info .name {
      font-weight: 600;
    }
    .user-info .role {
      font-size: 11px;
      opacity: 0.7;
    }
  `]
})
export class ClientSidebarComponent {}