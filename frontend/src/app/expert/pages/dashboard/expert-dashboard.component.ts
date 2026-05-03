import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-expert-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './expert-dashboard.component.html',
  styleUrl: './expert-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpertDashboardComponent {}
