import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ComplaintService } from './complaint.service';
import { Complaint, ComplaintStatus } from './complaint';
import { ComplaintDetailDialogComponent } from './complaint-detail-dialog.component';
import { StatsModalComponent } from './stats-modal.component';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { NotificationService, Notification } from './notification.service';

@Component({
  selector: 'app-complaint-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './complaint-list.component.html',
  styleUrls: ['./complaint.scss']
})
export class ComplaintListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'idComplaint',
    'title',
    'createdAt',
    'priority',
    'status',
    'actions'
  ];
  
  // Variables pour les filtres
  allComplaints: Complaint[] = [];
  filteredData: Complaint[] = [];
  searchText: string = '';
  dataSource = new MatTableDataSource<Complaint>([]);
  isLoading = false;
  
  statusFilter: string = 'ALL';
  priorityFilter: string = 'ALL';
  sentimentFilter: string = 'ALL';
  
  // Notifications
  notifications: Notification[] = [];
  showNotifications = false;
  unreadCount = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private complaintService: ComplaintService,
    private dialog: MatDialog,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadComplaints();
    this.notificationService.requestPermission();
    this.notificationService.startPolling();
    
    this.notificationService.getNotifications().subscribe((notifications: Notification[]) => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter((n: Notification) => !n.read).length;
    });
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(id: number): void {
    this.notificationService.markAsRead(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  loadComplaints(): void {
    this.isLoading = true;
    this.complaintService.getAllComplaints().subscribe({
      next: (data: Complaint[]) => {
        this.allComplaints = data || [];
        this.dataSource.data = this.allComplaints;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allComplaints];
    
    // Filtre recherche
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(c => 
        c.idComplaint.toString().includes(search) ||
        c.title?.toLowerCase().includes(search) || 
        c.description?.toLowerCase().includes(search)
      );
    }
    
    // Filtre statut
    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter(c => c.status === this.statusFilter);
    }
    
    // Filtre priorité
    if (this.priorityFilter !== 'ALL') {
      filtered = filtered.filter(c => c.priority === this.priorityFilter);
    }
    
    // Filtre sentiment
    if (this.sentimentFilter !== 'ALL') {
      filtered = filtered.filter(c => c.detectedSentiment === this.sentimentFilter);
    }
    
    this.filteredData = filtered;
    this.dataSource.data = filtered;
  }

  applyFilter(event: Event): void {
    this.searchText = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  applyStatusFilter(): void {
    this.applyFilters();
  }

  applyPriorityFilter(): void {
    this.applyFilters();
  }

  applySentimentFilter(): void {
    this.applyFilters();
  }

  resetAllFilters(): void {
    this.statusFilter = 'ALL';
    this.priorityFilter = 'ALL';
    this.sentimentFilter = 'ALL';
    this.searchText = '';
    this.applyFilters();
  }

  filterByStatus(status: string): void {
    this.statusFilter = status;
    this.priorityFilter = 'ALL';
    this.sentimentFilter = 'ALL';
    this.searchText = '';
    this.applyFilters();
  }
  
  filterByPriority(priority: string): void {
    this.statusFilter = 'ALL';
    this.priorityFilter = priority;
    this.sentimentFilter = 'ALL';
    this.searchText = '';
    this.applyFilters();
  }
  
  showAllComplaints(): void {
    this.statusFilter = 'ALL';
    this.priorityFilter = 'ALL';
    this.sentimentFilter = 'ALL';
    this.searchText = '';
    this.applyFilters();
  }

  getTotalComplaints(): number {
    return this.allComplaints.length;
  }

  getPendingCount(): number {
    return this.allComplaints.filter(c => c.status === 'PENDING').length;
  }

  getInProgressCount(): number {
    return this.allComplaints.filter(c => c.status === 'IN_PROGRESS').length;
  }

  getResolvedCount(): number {
    return this.allComplaints.filter(c => c.status === 'RESOLVED').length;
  }

  getHighPriorityCount(): number {
    return this.allComplaints.filter(c => c.priority === 'HIGH').length;
  }

  getPriorityClass(priority: string): string {
    const p = priority?.toUpperCase() || '';
    if (p === 'HIGH') return 'priority-high';
    if (p === 'MEDIUM') return 'priority-medium';
    if (p === 'LOW') return 'priority-low';
    return 'priority-medium';
  }

  updateStatus(complaint: Complaint, newStatus: ComplaintStatus): void {
    this.complaintService.updateStatus(complaint.idComplaint, newStatus).subscribe({
      next: (updated: Complaint) => {
        complaint.status = updated.status;
        const index = this.allComplaints.findIndex(c => c.idComplaint === complaint.idComplaint);
        if (index !== -1) {
          this.allComplaints[index].status = updated.status;
        }
        this.applyFilters();
      },
      error: (error: any) => {
        console.error('Erreur', error);
      }
    });
  }

  viewDetails(complaint: Complaint): void {
    const dialogRef = this.dialog.open(ComplaintDetailDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      panelClass: 'custom-dialog',
      data: complaint
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loadComplaints();
    });
  }

  deleteComplaint(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Complaint',
        message: 'Are you sure you want to permanently delete this complaint? This action cannot be undone.',
        type: 'danger',
        icon: '🗑️'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.complaintService.deleteComplaint(id).subscribe({
          next: () => {
            this.loadComplaints();
            this.showToast('✅ Complaint deleted successfully');
          },
          error: (error: any) => {
            console.error('Erreur', error);
            this.showToast('❌ Error deleting complaint');
          }
        });
      }
    });
  }

  showToast(message: string): void {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#333';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '9999';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  openStatsModal(): void {
    this.dialog.open(StatsModalComponent, {
      width: '850px',
      maxWidth: '90vw',
      panelClass: 'stats-modal'
    });
  }
  selectedIds = new Set<number>();

isSelected(id: number): boolean {
  return this.selectedIds.has(id);
}

toggleSelection(id: number, event: Event): void {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) this.selectedIds.add(id);
  else this.selectedIds.delete(id);
}

toggleSelectAll(event: Event): void {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) {
    this.filteredData.forEach(c => this.selectedIds.add(c.idComplaint));
  } else {
    this.selectedIds.clear();
  }
}

isAllSelected(): boolean {
  return this.filteredData.length > 0 && this.selectedIds.size === this.filteredData.length;
}

bulkDelete(): void {
  if (this.selectedIds.size === 0) return;
  const confirmMsg = `Supprimer ${this.selectedIds.size} réclamation(s) ?`;
  if (confirm(confirmMsg)) {
    this.complaintService.bulkDelete(Array.from(this.selectedIds)).subscribe({
      next: () => {
        this.selectedIds.clear();
        this.loadComplaints();
      },
      error: (err) => console.error(err)
    });
  }
}
}