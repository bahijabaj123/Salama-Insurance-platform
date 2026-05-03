import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClaimService } from '../../../core/services/claim.service';
import { Claim } from '../../../core/models/claim.model';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <img src="logo.png" 
               alt="Salama Insurance" 
               class="logo-img"
               (error)="logoError = true"
               [style.display]="logoError ? 'none' : 'block'" />
          <div class="logo-fallback" *ngIf="logoError">
            <i class="fas fa-shield-alt"></i>
          </div>
          <span class="logo-text">Salama</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li *ngFor="let item of menuItems" class="nav-item">
            <a [routerLink]="item.route" routerLinkActive="active" class="nav-link">
              <i [class]="item.icon"></i>
              <span>{{ item.label }}</span>
              <span *ngIf="item.badge" class="nav-badge">{{ item.badge }}</span>
            </a>
          </li>
        </ul>
      </nav>
      
      <div class="sidebar-footer">
        <div class="storage-info">
          <i class="fas fa-cloud-upload-alt"></i>
          <div class="storage-text">
            <span>49/50 GB used</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 98%"></div>
            </div>
          </div>
        </div>
        
        <div class="logout-btn">
          <i class="fas fa-sign-out-alt"></i>
          <span>Log out</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 260px;
      height: 100vh;
      background: linear-gradient(180deg, #185FA5 0%, #0e3d6b 100%);
      color: white;
      z-index: 101;
      transition: all 0.3s;
      display: flex;
      flex-direction: column;
    }
    
    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo-img {
      height: 40px;
      width: auto;
    }
    
    .logo-fallback {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo-fallback i {
      font-size: 22px;
      color: white;
    }
    
    .logo-text {
      font-size: 20px;
      font-weight: 600;
      color: white;
    }
    
    .sidebar-nav {
      flex: 1;
      padding: 20px 0;
      overflow-y: auto;
    }
    
    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .nav-item {
      margin-bottom: 4px;
    }
    
    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      color: rgba(255,255,255,0.8);
      text-decoration: none;
      transition: all 0.3s;
      position: relative;
    }
    
    .nav-link:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }
    
    .nav-link.active {
      background: rgba(255,255,255,0.15);
      color: white;
      border-left: 3px solid #FF8C00;
    }
    
    .nav-link i {
      width: 20px;
      font-size: 18px;
    }
    
    .nav-badge {
      margin-left: auto;
      background: #FF8C00;
      color: white;
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 11px;
    }
    
    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .storage-info {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .storage-info i {
      font-size: 24px;
      opacity: 0.8;
    }
    
    .storage-text {
      flex: 1;
    }
    
    .storage-text span {
      font-size: 12px;
      display: block;
      margin-bottom: 6px;
    }
    
    .progress-bar {
      height: 4px;
      background: rgba(255,255,255,0.2);
      border-radius: 2px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: #FF8C00;
      border-radius: 2px;
    }
    
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.3s;
    }
    
    .logout-btn:hover {
      background: rgba(255,255,255,0.1);
    }
    
    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }
      
      .sidebar.open {
        transform: translateX(0);
      }
    }
  `]
})
export class SidebarComponent implements OnInit {
  logoError = false;
  fraudBadgeCount = 0;
  
  menuItems: MenuItem[] = [
    { icon: 'fas fa-chart-line', label: 'Dashboard', route: '/assureur/dashboard' },
    { icon: 'fas fa-file-alt', label: 'Claims', route: '/assureur/claims', badge: 5 },
    { icon: 'fas fa-map', label: 'Claims map', route: '/assureur/map' },
    { icon: 'fas fa-shield-alt', label: 'Anti-fraud', route: '/assureur/fraud', badge: 0 },
    { icon: 'fas fa-chart-bar', label: 'Statistics', route:  '/assureur/statistiques' },
    { icon: 'fas fa-tools', label: 'Manage garages', route:  '/assureur/garages'  }
  ];

  constructor(private claimService: ClaimService) {}

  ngOnInit(): void {
    this.loadFraudCount();
  }

  loadFraudCount(): void {
    this.claimService.getAllClaims().subscribe({
      next: (claims: Claim[]) => {
        const suspiciousCount = claims.filter((c: Claim) => 
          (c.urgencyScore && c.urgencyScore > 70) || 
          (c.notes && c.notes.toLowerCase().includes('contradiction'))
        ).length;
        
        this.fraudBadgeCount = suspiciousCount;
        
        const fraudMenu = this.menuItems.find(m => m.route === '/assureur/fraud');
        if (fraudMenu) {
          fraudMenu.badge = this.fraudBadgeCount;
        }
      },
      error: (err) => {
        console.error('Error loading fraud count:', err);
        this.fraudBadgeCount = 3;
      }
    });
  }

   logout(): void {
  localStorage.clear();
  window.location.href = '/assureur/logout';
}
}