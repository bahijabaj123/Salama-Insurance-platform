export enum ComplaintStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED'
}

export interface Complaint {
  idComplaint: number;
  title: string;
  description: string;
  createdAt: string;
  detectedSentiment: string;
  priority: string;
  status: ComplaintStatus;
  sentiment?: string;
  indemnity?: {
    idIndemnity: number;
    // autres propriétés de l'indemnité
  };
   response?: string;
  responseDate?: string;
  respondedBy?: string;
}