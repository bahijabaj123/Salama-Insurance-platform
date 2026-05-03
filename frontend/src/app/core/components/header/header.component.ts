import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="header-container">
        <div class="logo-area">
          <img src="assets/logo.png" alt="Salama Insurance" class="logo" />
          <span class="logo-text">Salama Insurance</span>
        </div>
        
        <div class="header-right">
          <div class="notification-icons">
            <div class="icon-badge">
              <i class="fas fa-bell"></i>
              <span class="badge">3</span>
            </div>
            <div class="icon-badge">
              <i class="fas fa-envelope"></i>
              <span class="badge">5</span>
            </div>
          </div>
          
          <div class="user-info">
<div class="user-avatar-placeholder">
  <i class="fas fa-user-circle" style="font-size: 36px;"></i>
</div>
            <div class="user-details">
              <span class="user-name">John Doe</span>
              <span class="user-role">Assureur</span>
            </div>
            <i class="fas fa-chevron-down"></i>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      position: fixed;
      top: 0;
      right: 0;
      left: 260px;
      height: 70px;
      background: white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      z-index: 100;
      transition: all 0.3s;
    }
    
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      padding: 0 24px;
    }
    
    .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo {
      height: 40px;
      width: auto;
    }
    
    .logo-text {
      font-size: 18px;
      font-weight: 600;
      color: #185FA5;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    
    .notification-icons {
      display: flex;
      gap: 16px;
    }
    
    .icon-badge {
      position: relative;
      cursor: pointer;
    }
    
    .icon-badge i {
      font-size: 20px;
      color: #6b7a8e;
    }
    
    .badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #A32D2D;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 16px;
      text-align: center;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }
    
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .user-details {
      display: flex;
      flex-direction: column;
    }
    
    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: #1a2332;
    }
    
    .user-role {
      font-size: 11px;
      color: #6b7a8e;
    }
    
    @media (max-width: 768px) {
      .header {
        left: 0;
      }
      
      .logo-text {
        display: none;
      }
      
      .user-details {
        display: none;
      }
    }
  `]
})
export class HeaderComponent {}