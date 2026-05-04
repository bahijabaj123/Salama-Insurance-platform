import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-stats-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-modal">
      <div class="modal-header">
        <div class="header-title">
          <span class="header-icon">📊</span>
          <h2>Complaints Statistics</h2>
        </div>
        <button class="close-btn" (click)="close()">✕</button>
      </div>
      
      <div class="modal-body">
        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon total-icon">📋</div>
            <div class="kpi-value">{{ stats.total }}</div>
            <div class="kpi-label">Total</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon pending-icon">⏳</div>
            <div class="kpi-value">{{ stats.pending }}</div>
            <div class="kpi-label">Pending</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon resolved-icon">✅</div>
            <div class="kpi-value">{{ stats.resolved }}</div>
            <div class="kpi-label">Resolved</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon urgent-icon">⚠️</div>
            <div class="kpi-value">{{ stats.highPriority }}</div>
            <div class="kpi-label">High Priority</div>
          </div>
        </div>

        <!-- Charts -->
        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-header">
              <span class="chart-icon">📈</span>
              <h3>Evolution (last 7 days)</h3>
            </div>
            <div class="chart-container">
              <canvas id="evolutionChart"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-header">
              <span class="chart-icon">🎭</span>
              <h3>Sentiment Distribution</h3>
            </div>
            <div class="chart-container">
              <canvas id="sentimentChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Average Time Card -->
        <div class="avg-time-card">
          <div class="avg-time-icon">⏱️</div>
          <div class="avg-time-content">
            <div class="avg-time-label">Average Processing Time</div>
            <div class="avg-time-value">{{ stats.averageProcessingTime || 0 }} hours</div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="close-footer-btn" (click)="close()">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .stats-modal {
      background: white;
      border-radius: 24px;
      width: 850px;
      max-width: 90vw;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      flex-shrink: 0;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      font-size: 28px;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }

    .modal-body {
      padding: 24px;
      background: #f5f7fa;
      flex: 1;
      overflow-y: auto;
    }

    /* Scrollbar personnalisée */
    .modal-body::-webkit-scrollbar {
      width: 6px;
    }

    .modal-body::-webkit-scrollbar-track {
      background: #e9ecef;
      border-radius: 3px;
    }

    .modal-body::-webkit-scrollbar-thumb {
      background: #667eea;
      border-radius: 3px;
    }

    /* KPI Cards */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    .kpi-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }

    .kpi-value {
      font-size: 32px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .kpi-label {
      font-size: 13px;
      color: #666;
      margin-top: 8px;
      font-weight: 500;
    }

    /* Charts */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .chart-card {
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .chart-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e9ecef;
    }

    .chart-icon {
      font-size: 20px;
    }

    .chart-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .chart-container {
      position: relative;
      height: 200px;
    }

    .chart-container canvas {
      max-height: 100%;
      width: 100%;
    }

    /* Average Time Card */
    .avg-time-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      color: white;
    }

    .avg-time-icon {
      font-size: 40px;
    }

    .avg-time-content {
      flex: 1;
    }

    .avg-time-label {
      font-size: 12px;
      opacity: 0.8;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .avg-time-value {
      font-size: 24px;
      font-weight: 700;
    }

    /* Footer */
    .modal-footer {
      padding: 16px 24px;
      background: white;
      border-top: 1px solid #e9ecef;
      text-align: right;
      flex-shrink: 0;
    }

    .close-footer-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 30px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .close-footer-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    /* Responsive */
    @media (max-width: 700px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StatsModalComponent implements OnInit {
  stats = { total: 0, pending: 0, resolved: 0, highPriority: 0, rejected: 0, evolutionByDay: {}, sentimentDistribution: {}, averageProcessingTime: 0 };
  
  private evolutionChart: Chart | null = null;
  private sentimentChart: Chart | null = null;

  constructor(private dialogRef: MatDialogRef<StatsModalComponent>, private http: HttpClient) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.http.get('http://localhost:8082/api/complaints/stats').subscribe((data: any) => {
      console.log('Stats received:', data);
      this.stats = data;
      this.destroyCharts();
      setTimeout(() => this.createCharts(), 100);
    });
  }

  destroyCharts() {
    if (this.evolutionChart) {
      this.evolutionChart.destroy();
      this.evolutionChart = null;
    }
    if (this.sentimentChart) {
      this.sentimentChart.destroy();
      this.sentimentChart = null;
    }
  }

  createCharts() {
    const evolutionCtx = document.getElementById('evolutionChart') as HTMLCanvasElement;
    if (evolutionCtx) {
      this.evolutionChart = new Chart(evolutionCtx, {
        type: 'line',
        data: {
          labels: Object.keys(this.stats.evolutionByDay),
          datasets: [{
            label: 'Complaints',
            data: Object.values(this.stats.evolutionByDay),
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    const sentimentCtx = document.getElementById('sentimentChart') as HTMLCanvasElement;
    if (sentimentCtx) {
      this.sentimentChart = new Chart(sentimentCtx, {
        type: 'doughnut',
        data: {
          labels: ['Positive', 'Neutral', 'Negative'],
          datasets: [{
            data: [
              (this.stats.sentimentDistribution as any)['POSITIVE'] || 0,
              (this.stats.sentimentDistribution as any)['NEUTRAL'] || 0,
              (this.stats.sentimentDistribution as any)['NEGATIVE'] || 0
            ],
            backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  }

  close() { 
    this.destroyCharts();
    this.dialogRef.close(); 
  }
}