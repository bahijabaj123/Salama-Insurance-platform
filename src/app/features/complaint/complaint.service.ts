import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Complaint, ComplaintStatus } from './complaint';

@Injectable({
  providedIn: 'root'
})
export class ComplaintService {
  private apiUrl = 'http://localhost:8082/api/complaints';

  constructor(private http: HttpClient) { }

  getAllComplaints(): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.apiUrl}/all`);
  }

 getComplaintsByClaimId(claimId: number): Observable<Complaint[]> {
    return this.http.get<Complaint[]>(`${this.apiUrl}/claim/${claimId}`);
}

createComplaint(complaint: { title: string; description: string; claimId: number }): Observable<Complaint> {
  return this.http.post<Complaint>(`${this.apiUrl}/add`, complaint);
}

  updateComplaint(id: number, complaint: Partial<Complaint>): Observable<Complaint> {
    return this.http.put<Complaint>(`${this.apiUrl}/update/${id}`, complaint);
  }

  deleteComplaint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  updateStatus(id: number, status: ComplaintStatus): Observable<Complaint> {
    return this.http.patch<Complaint>(`${this.apiUrl}/${id}/status`, { status });
  }

  // ✅ Nouvelles méthodes
  respondToComplaint(id: number, response: string, respondedBy: string): Observable<Complaint> {
    return this.http.post<Complaint>(`${this.apiUrl}/${id}/respond`, { response, respondedBy });
  }

  resolveComplaint(id: number): Observable<Complaint> {
    return this.http.patch<Complaint>(`${this.apiUrl}/${id}/resolve`, {});
  }
  bulkDelete(ids: number[]): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/bulk-delete`, { body: ids });
}
}