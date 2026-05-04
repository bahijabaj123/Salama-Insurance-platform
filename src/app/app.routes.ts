import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { ClientLayoutComponent } from './core/layouts/client-layout/client-layout.component';
import { DashboardComponent } from './features/assureur/dashboard/dashboard.component';
import { ClaimsListComponent } from './features/claims/claims-list/claims-list.component';
import { ClaimDetailComponent } from './features/claims/claim-detail/claim-detail.component';
import { FraudDashboardComponent } from './features/assureur/fraud-dashboard/fraud-dashboard.component';
import { TunisiaMapComponent } from './features/assureur/tunisia-map/tunisia-map.component';
import { ClientDashboardComponent } from './features/client/client-dashboard/client-dashboard.component';
import { ClientSinistreDetailComponent } from './features/client/client-sinistre-detail/client-sinistre-detail.component';
import { ClientAssistantComponent } from './features/client/client-assistant/client-assistant.component';
import { ClientDocumentsComponent } from './features/client/client-documents/client-documents.component';
import { ClientNotificationsComponent } from './features/client/client-notifications/client-notifications.component';
import { ComplaintListComponent } from './features/complaint/complaint-list.component';
import { ClientComplaintListComponent } from './features/client/client-complaint-list/client-complaint-list.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'claims', component: ClaimsListComponent },
      { path: 'claims/:id', component: ClaimDetailComponent },
      { path: 'fraud', component: FraudDashboardComponent },
      { path: 'map', component: TunisiaMapComponent },
      { path: 'complaints', component: ComplaintListComponent },

      // ✅ Route indemnité ajoutée
     {
        path: 'indemnity/:id',
        loadComponent: () => import('./features/assureur/indemnity/indemnity')
        .then(m => m.IndemnityComponent)
      },
    ]
  },

  {
    path: 'client',
    component: ClientLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ClientDashboardComponent },
      { path: 'sinistres/:id', component: ClientSinistreDetailComponent },
      { path: 'assistant', component: ClientAssistantComponent },
      { path: 'documents', component: ClientDocumentsComponent },
      { path: 'notifications', component: ClientNotificationsComponent },
      { path: 'reclamations', component: ClientComplaintListComponent },
      { path: 'claim/:claimId/reclamations', component: ClientComplaintListComponent }
    ]
  },

  { path: '**', redirectTo: '/dashboard' }
];