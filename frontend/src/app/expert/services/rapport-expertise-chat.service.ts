import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Expert } from '../models/expert.model';
import {
  AccidentImageAnalysisResult,
  ChatbotApiResponse,
  ExpertiseReport
} from '../models/expertise-report.model';

@Injectable({
  providedIn: 'root'
})
export class RapportExpertiseChatService {
  private readonly rapportsBase = `${environment.apiBaseUrl}/api/rapports-expertise`;
  private readonly expertiseAiBase = `${environment.apiBaseUrl}/api/expertise-ai`;
  private readonly expertsUrl = `${environment.apiBaseUrl}/api/experts`;
  private readonly chatUrl = `${environment.apiBaseUrl}/api/chatbot/message`;
  private readonly chatbotTestUrl = `${environment.apiBaseUrl}/api/chatbot/test`;

  expertTestEmail = 'expert@salama.tn';

  constructor(private http: HttpClient) {}

  getExperts(): Observable<Expert[]> {
    return this.http.get<Expert[]>(this.expertsUrl);
  }

  createReport(expertId: number, report: Partial<ExpertiseReport>): Observable<ExpertiseReport> {
    return this.http.post<ExpertiseReport>(`${this.rapportsBase}/expert/${expertId}`, report);
  }

  getAllReports(): Observable<ExpertiseReport[]> {
    return this.http.get<ExpertiseReport[]>(`${this.rapportsBase}/all`);
  }

  getByReference(reference: string): Observable<ExpertiseReport> {
    return this.http.get<ExpertiseReport>(`${this.rapportsBase}/reference/${encodeURIComponent(reference.trim())}`);
  }

  getGlobalStats(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.rapportsBase}/statistiques`);
  }

  getExpertDashboardComplet(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${environment.apiBaseUrl}/api/expert-dashboard`);
  }

  downloadExpertReportPdf(reportId: number): Observable<Blob> {
    return this.http.get(`${this.rapportsBase}/${reportId}/pdf`, { responseType: 'blob' });
  }

  analyzeAccidentImageByUrl(imageUrl: string): Observable<AccidentImageAnalysisResult> {
    return this.http.post<AccidentImageAnalysisResult>(`${this.expertiseAiBase}/analyze-url`, { imageUrl });
  }

  analyzeAccidentImageUpload(file: File): Observable<AccidentImageAnalysisResult> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<AccidentImageAnalysisResult>(`${this.expertiseAiBase}/upload`, fd);
  }

  checkChatbotConnection(): Observable<string> {
    return this.http.get(this.chatbotTestUrl, { responseType: 'text' });
  }

  sendExpertChat(message: string): Observable<ChatbotApiResponse> {
    const headers = new HttpHeaders({
      'X-User-Email': this.expertTestEmail
    });
    return this.http.post<ChatbotApiResponse>(this.chatUrl, { message, userType: 'EXPERT' }, { headers });
  }
}
