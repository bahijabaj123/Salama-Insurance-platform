import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-client-faq',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>FAQ</mat-card-title>
        <mat-card-subtitle>Questions fréquentes</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p>❓ Page en cours de développement</p>
        <p>Cette page sera reliée au travail de votre coéquipier.</p>
      </mat-card-content>
    </mat-card>
  `
})
export class ClientFaqComponent {}