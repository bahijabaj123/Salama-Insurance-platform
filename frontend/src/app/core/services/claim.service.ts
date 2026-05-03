import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Claim, ClaimResponseDTO, ClaimStatus,
  Expert, FraudAnalysis, FraudDashboard,
  ClaimStatistics, PagedResponse, Accident
} from '../models/claim.model';

@Injectable({ providedIn: 'root' })
export class ClaimService {

  // Backend sur le port 8082
  private readonly BASE = 'http://localhost:8082/api';
  private readonly apiUrl = 'http://localhost:8082/api';
  constructor(private http: HttpClient) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // CLAIMS CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  getAllClaims(): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.BASE}/claims`);
  }

  getClaimById(id: number): Observable<Claim> {
    return this.http.get<Claim>(`${this.BASE}/claims/${id}`);
  }

  getClaimByReference(reference: string): Observable<Claim> {
    return this.http.get<Claim>(`${this.BASE}/claims/reference/${reference}`);
  }

  getClaimsPaginated(page = 0, size = 10, sortBy = 'id', sortDirection = 'DESC'): Observable<PagedResponse<Claim>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);
    return this.http.get<PagedResponse<Claim>>(`${this.BASE}/claims/paginated`, { params });
  }

  createClaimFromAccident(accidentId: number, insurerId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/claims/create-from-accident/${accidentId}?insurerId=${insurerId}`, {});
}

  updateClaim(id: number, payload: Partial<Claim>): Observable<Claim> {
    return this.http.put<Claim>(`${this.BASE}/claims/${id}`, payload);
  }

  deleteClaim(id: number): Observable<string> {
    return this.http.delete<string>(`${this.BASE}/claims/${id}`, { responseType: 'text' as 'json' });
  }

  deleteClaimByReference(reference: string): Observable<string> {
    return this.http.delete<string>(
      `${this.BASE}/claims/reference/${reference}`,
      { responseType: 'text' as 'json' }
    );
  }

  deleteBatch(ids: number[]): Observable<string> {
    return this.http.delete<string>(
      `${this.BASE}/claims/batch`,
      { body: ids, responseType: 'text' as 'json' }
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  updateStatus(claimId: number, status: ClaimStatus): Observable<Claim> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<Claim>(`${this.BASE}/claims/${claimId}/status`, {}, { params });
  }

  openClaim(claimId: number): Observable<Claim> {
    return this.http.patch<Claim>(`${this.BASE}/claims/${claimId}/open`, {});
  }

  closeClaim(claimId: number): Observable<Claim> {
    return this.http.patch<Claim>(`${this.BASE}/claims/${claimId}/close`, {});
  }

  cancelClaim(claimId: number): Observable<Claim> {
    return this.http.patch<Claim>(`${this.BASE}/claims/${claimId}/cancel`, {});
  }

saveNotification(data: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/notifications/save`, data);
}


  // ═══════════════════════════════════════════════════════════════════════════
  // FILTERS & SEARCH
  // ═══════════════════════════════════════════════════════════════════════════

  getClaimsByStatus(status: ClaimStatus): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.BASE}/claims/status/${status}`);
  }

  getClaimsByExpert(expertId: number): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.BASE}/claims/expert/${expertId}`);
  }

  getClaimsByRegion(region: string): Observable<Claim[]> {
    return this.http.get<Claim[]>(`${this.BASE}/claims/region/${region}`);
  }

  getClaimsByDateRange(start: string, end: string): Observable<Claim[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<Claim[]>(`${this.BASE}/claims/date-range`, { params });
  }

  searchClaims(filters: {
    reference?: string;
    status?: ClaimStatus;
    region?: string;
    expertId?: number;
    startDate?: string;
    endDate?: string;
  }): Observable<Claim[]> {
    let params = new HttpParams();
    if (filters.reference) params = params.set('reference', filters.reference);
    if (filters.status)    params = params.set('status', filters.status);
    if (filters.region)    params = params.set('region', filters.region);
    if (filters.expertId)  params = params.set('expertId', filters.expertId);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate)   params = params.set('endDate', filters.endDate);
    return this.http.get<Claim[]>(`${this.BASE}/claims/search`, { params });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPERT ASSIGNMENT
  // ═══════════════════════════════════════════════════════════════════════════

  getAvailableExperts(): Observable<Expert[]> {
    return this.http.get<Expert[]>(`${this.BASE}/experts/available`);
  }

  getAllExperts(): Observable<Expert[]> {
    return this.http.get<Expert[]>(`${this.BASE}/experts`);
  }

  assignExpert(claimId: number, expertId: number): Observable<ClaimResponseDTO> {
    return this.http.post<ClaimResponseDTO>(
      `${this.BASE}/claims/${claimId}/assign-expert/${expertId}`,
      {}
    );
  }

  autoAssignExpert(claimId: number): Observable<Claim> {
    return this.http.post<Claim>(`${this.BASE}/claims/${claimId}/auto-assign-expert`, {});
  }

  unassignExpert(claimId: number): Observable<Claim> {
    return this.http.post<Claim>(`${this.BASE}/claims/${claimId}/unassign-expert`, {});
  }

  getAssignmentDetails(claimId: number): Observable<any> {
    return this.http.get<any>(`${this.BASE}/claims/${claimId}/assignment-details`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FRAUD ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  analyzeFraud(claimId: number): Observable<FraudAnalysis> {
    return this.http.post<FraudAnalysis>(`${this.BASE}/fraud/analyze/${claimId}`, {});
  }

  analyzeFraudWithAlert(claimId: number): Observable<{ analysis: FraudAnalysis; alertSent: boolean; message: string }> {
    return this.http.post<{ analysis: FraudAnalysis; alertSent: boolean; message: string }>(
      `${this.BASE}/fraud/analyze-with-alert/${claimId}`, 
      {}
    );
  }

  getFraudAnalysisByClaimId(claimId: number): Observable<FraudAnalysis> {
    return this.http.get<FraudAnalysis>(`${this.BASE}/fraud/analysis/${claimId}`);
  }

  getAllFraudAnalyses(): Observable<FraudAnalysis[]> {
    return this.http.get<FraudAnalysis[]>(`${this.BASE}/fraud/analyses`);
  }

  getFraudDashboard(): Observable<FraudDashboard> {
    return this.http.get<FraudDashboard>(`${this.BASE}/fraud/dashboard`);
  }

  getFraudByRiskLevel(level: string): Observable<FraudAnalysis[]> {
    return this.http.get<FraudAnalysis[]>(`${this.BASE}/fraud/risk/${level}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCIDENTS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  getAllAccidents(): Observable<Accident[]> {
    return this.http.get<Accident[]>(`${this.BASE}/accidents`);
  }

  getAccidentById(id: number): Observable<Accident> {
    return this.http.get<Accident>(`${this.BASE}/accidents/${id}`);
  }

  createAccident(accident: Partial<Accident>): Observable<Accident> {
    return this.http.post<Accident>(`${this.BASE}/accidents`, accident);
  }

  updateAccident(id: number, accident: Partial<Accident>): Observable<Accident> {
    return this.http.put<Accident>(`${this.BASE}/accidents/${id}`, accident);
  }

  deleteAccident(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/accidents/${id}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATISTICS
  // ═══════════════════════════════════════════════════════════════════════════

  getStatistics(): Observable<ClaimStatistics> {
    return this.http.get<ClaimStatistics>(`${this.BASE}/claims/statistics`);
  }

  getStatsByStatus(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.BASE}/claims/statistics/by-status`);
  }

  getStatsByRegion(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.BASE}/claims/statistics/by-region`);
  }

  getTotalCount(): Observable<number> {
    return this.http.get<number>(`${this.BASE}/claims/count`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PDF REPORTS
  // ═══════════════════════════════════════════════════════════════════════════

  downloadPdf(claimId: number): void {
    window.open(`${this.BASE}/reports/claim/${claimId}/pdf/download`, '_blank');
  }

  viewPdf(claimId: number): void {
    window.open(`${this.BASE}/reports/claim/${claimId}/pdf`, '_blank');
  }

  downloadAccidentPdf(accidentId: number): void {
    window.open(`${this.BASE}/reports/accident/${accidentId}/pdf/download`, '_blank');
  }

  uploadFinalInvoice(claimId: number, formData: FormData): Observable<Claim> {
  return this.http.post<Claim>(`${this.apiUrl}/claims/${claimId}/upload-final-invoice`, formData);
}

// upload et telecharger les documents

getClaimDocuments(claimId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/documents/claim/${claimId}`);
}

downloadDocument(documentId: number): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/documents/download/${documentId}`, { responseType: 'blob' });
}

}