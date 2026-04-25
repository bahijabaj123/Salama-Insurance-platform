import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmailRequest {
  to: string;
  claimReference: string;
  status: string;
  message: string;
  urgencyScore?: number;
  expertName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private readonly BASE = 'http://localhost:8082/api/email';

  constructor(private http: HttpClient) {}

  // Envoi d'email personnalisé pour mise à jour de sinistre
  sendCustomNotification(emailData: EmailRequest): Observable<string> {
    return this.http.post<string>(`${this.BASE}/send-claim-update`, emailData);
  }

  sendClaimUpdateEmail(request: EmailRequest): Observable<string> {
    return this.http.post<string>(`${this.BASE}/send-claim-update`, request);
  }


  // Envoi de notification urgente
  sendUrgentNotification(emailData: EmailRequest): Observable<string> {
    return this.http.post<string>(`${this.BASE}/send-urgent-notification`, emailData);
  }

  // Envoi d'email d'assignation d'expert
  sendAssignmentEmail(emailData: EmailRequest): Observable<string> {
    return this.http.post<string>(`${this.BASE}/send-assignment`, emailData);
  }
}