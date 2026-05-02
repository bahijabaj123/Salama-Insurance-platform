import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';

import { MatIconModule } from '@angular/material/icon';



@Component({

  selector: 'app-client-expert-consultation',

  standalone: true,

  imports: [CommonModule, MatButtonModule, MatIconModule],

  templateUrl: './client-expert-consultation.component.html',

  styleUrl: './client-expert-consultation.component.scss',

})

export class ClientExpertConsultationComponent {

  constructor(private readonly router: Router) {}



  goCommunicateWithExpert(): void {
    void this.router.navigate(['/client/dashboard'], { fragment: 'expert-comm' });
  }



  goFollow(): void {
    void this.router.navigate(['/client/dashboard'], { fragment: 'follow-dash' });
  }

}

