import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-left">
          <p>&copy; 2026 Salama Insurance. All rights reserved.</p>
        </div>
        <div class="footer-right">
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">Legal notice</a>
          <a href="#">Support</a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      position: fixed;
      bottom: 0;
      right: 0;
      left: 260px;
      background: white;
      border-top: 1px solid #e0e0e0;
      padding: 12px 24px;
      font-size: 12px;
      transition: all 0.3s;
    }
    
    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .footer-left p {
      margin: 0;
      color: #6b7a8e;
    }
    
    .footer-right {
      display: flex;
      gap: 20px;
    }
    
    .footer-right a {
      color: #6b7a8e;
      text-decoration: none;
      transition: color 0.3s;
    }
    
    .footer-right a:hover {
      color: #185FA5;
    }
    
    @media (max-width: 768px) {
      .footer {
        left: 0;
      }
      
      .footer-content {
        flex-direction: column;
        gap: 10px;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {}