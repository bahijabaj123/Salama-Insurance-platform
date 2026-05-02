import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent],
  template: `
    <div class="main-layout">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <app-header></app-header>
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
        <app-footer></app-footer>
      </div>
    </div>
  `,
  styles: [`
    .main-layout {
      display: flex;
      min-height: 100vh;
    }
    
    .main-content {
      flex: 1;
      margin-left: 260px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f4f6f9;
    }
    
    .page-content {
      flex: 1;
      padding: 24px;
      margin-top: 70px;
      margin-bottom: 60px;
    }
    
    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
      }
    }
  `]
})
export class MainLayoutComponent {}