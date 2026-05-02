import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="client-layout">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .client-layout {
      min-height: 100vh;
      background: #f4f6f9;
    }
  `]
})
export class ClientLayoutComponent {}