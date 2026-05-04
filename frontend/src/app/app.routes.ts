import { Routes } from '@angular/router';

// ============================================================
// IMPORTS AUTH / ADMIN / EXPERT (de son projet)
// ============================================================
import { adminAuthGuard } from './admin/guards/admin-auth.guard';
import { AdminLayoutComponent } from './admin/layout/admin-layout.component';
import { AdminDashboardComponent } from './admin/pages/dashboard/admin-dashboard.component';
import { AdminRoleRequestsComponent } from './admin/pages/role-requests/admin-role-requests.component';
import { AdminUserDevicesComponent } from './admin/pages/user-devices/admin-user-devices.component';
import { AdminUsersComponent } from './admin/pages/users/admin-users.component';
import { clientAuthGuard } from './client/guards/client-auth.guard';
import { ClientProfileComponent } from './client/pages/profile/client-profile.component';
import { ClientSimplePageComponent } from './client/pages/simple/client-simple-page.component';
import { ExpertDashboardComponent } from './expert/pages/dashboard/expert-dashboard.component';
import { CreateExpertComponent } from './expert/pages/create-expert/create-expert.component';
import { ExpertVehicleDamageComponent } from './expert/pages/expert-vehicle-damage/expert-vehicle-damage.component';
import { ExpertVehicleSelectionComponent } from './expert/pages/expert-vehicle-selection/expert-vehicle-selection.component';
import { RapportExpertiseChatComponent } from './expert/pages/rapport-expertise-chat/rapport-expertise-chat.component';
import { RapportExpertiseFormComponent } from './expert/pages/rapport-expertise-form/rapport-expertise-form.component';
import { RapportStatistiquesDashboardComponent } from './expert/pages/rapport-statistiques-dashboard/rapport-statistiques-dashboard.component';
import { ConsulterMessagesComponent } from './expert/pages/consulter-messages/consulter-messages.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { OAuth2SuccessComponent } from './pages/oauth2-success/oauth2-success.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { SignupComponent } from './pages/signup/signup.component';


// IMPORTS ACCIDENT
import { AccidentComponent } from './features/accident/accident.component';

// ============================================================
// IMPORTS LAYOUTS (ton projet)
// ============================================================
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';

// ============================================================
// IMPORTS ASSUREUR (ton projet)
// ============================================================
import { DashboardComponent } from './features/assureur/dashboard/dashboard.component';
import { ClaimsListComponent } from './features/claims/claims-list/claims-list.component';
import { ClaimDetailComponent } from './features/claims/claim-detail/claim-detail.component';
import { FraudDashboardComponent } from './features/assureur/fraud-dashboard/fraud-dashboard.component';
import { TunisiaMapComponent } from './features/assureur/tunisia-map/tunisia-map.component';
import { ClaimGarageProximityComponent } from './features/claims/claim-garage-proximity/claim-garage-proximity.component';
import { GaragesComponent } from './features/assureur/garages/garages.component';
import { assureurAuthGuard } from './features/assureur/guards/assureur-auth.guard';

// ============================================================
// IMPORTS CLIENT (ton projet - DASHBOARD COMPLET)
// ============================================================
import { ClientDashboardComponent } from './features/client/client-dashboard/client-dashboard.component';
import { ClientSinistreDetailComponent } from './features/client/client-sinistre-detail/client-sinistre-detail.component';
import { ClientAssistantComponent } from './features/client/client-assistant/client-assistant.component';
import { ClientNotificationsComponent } from './features/client/client-notifications/client-notifications.component';
import { ClientDocumentsComponent } from './features/client/client-documents/client-documents.component';
import { ClientDashboardHomeComponent } from './features/client/client-dashboard/client-dashboard-home.component';
import { ClientSosComponent } from './features/client/client-sos/client-sos.component';
import { ClientExpertConsultationComponent } from './features/client/client-expert-consultation/client-expert-consultation.component';
import { ClientExpertMessagesComponent } from './features/client/client-expert-messages/client-expert-messages.component';
import { ClientProcessingStatsComponent } from './features/client/client-processing-stats/client-processing-stats.component';

// ============================================================
// COMPOSANT DE DÉCONNEXION SIMPLE (temporaire)
// ============================================================
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStorageService } from './core/auth/auth-storage.service';

@Component({
  selector: 'app-logout',
  standalone: true,
  template: `<div>Déconnexion en cours...</div>`
})
export class LogoutComponent {
  constructor(
    private authStorage: AuthStorageService,
    private router: Router
  ) {
    this.authStorage.clear();
    this.router.navigate(['/login']);
  }
}

export const routes: Routes = [
  // ============================================================
  // PAGES PUBLIQUES
  // ============================================================
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'oauth2/success', component: OAuth2SuccessComponent },

  { path: 'accident', component: AccidentComponent },

 
  // ============================================================
  // ROUTES ADMIN
  // ============================================================
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminAuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboardComponent, data: { title: 'Dashboard' } },
      { path: 'users', component: AdminUsersComponent, data: { title: 'Users' } },
      { path: 'role-requests', component: AdminRoleRequestsComponent, data: { title: 'Role Requests' } },
      { path: 'user-devices', component: AdminUserDevicesComponent, data: { title: 'User Devices' } }
    ]
  },

  // ============================================================
  // ROUTES ASSUREUR (ton projet)
// ============================================================
{
  path: 'assureur',
component: MainLayoutComponent,
  canActivate: [assureurAuthGuard],
  children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'claims', component: ClaimsListComponent },
    { path: 'claims/:id/garage', component: ClaimGarageProximityComponent },
{ path: 'claims/:id', component: ClaimDetailComponent },
    { path: 'map', component: TunisiaMapComponent },
    { path: 'fraud', component: FraudDashboardComponent },
    { path: 'statistiques',  component: DashboardComponent },
    { path: 'garages', component: GaragesComponent },
    { path: 'logout', component: LogoutComponent }
  ]
},
  // ROUTES CLIENT (TON DASHBOARD COMPLET)
  // ============================================================
  {
  path: 'client',
  component: ClientDashboardComponent,  // ← Layout avec sidebar
  canActivate: [clientAuthGuard],
  children: [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'dashboard', component: ClientDashboardHomeComponent }, 
    { path: 'sinistres/:id', component: ClientSinistreDetailComponent },
    { path: 'documents', component: ClientDocumentsComponent },
    { path: 'notifications', component: ClientNotificationsComponent },
    { path: 'assistant', component: ClientAssistantComponent },
    { path: 'sos', component: ClientSosComponent },
    { path: 'garages', redirectTo: 'sos', pathMatch: 'full' },
    { path: 'consultation-expert', component: ClientExpertConsultationComponent },
    { path: 'messages-expert', component: ClientExpertMessagesComponent },
    { path: 'processing-stats', component: ClientProcessingStatsComponent },
    { path: 'profile', component: ClientProfileComponent },
    { path: 'create-contract', component: ClientSimplePageComponent },
    { path: 'history', component: ClientSimplePageComponent },
    { path: 'logout', component: LogoutComponent }
  ]
},

  // ============================================================
  // ROUTES EXPERT
  // ============================================================
  { path: 'expert/dashboard', component: ExpertDashboardComponent },
  { path: 'expert', pathMatch: 'full', redirectTo: 'expert/dashboard' },
  { path: 'expert/dashboard', component: ExpertDashboardComponent },
  { path: 'expert/create', component: CreateExpertComponent },
  { path: 'expert/edit/:id', component: CreateExpertComponent },
  { path: 'expert/chat', component: RapportExpertiseChatComponent },
  { path: 'expert/consulter/thread/:expertKey', component: ConsulterMessagesComponent },
  { path: 'expert/consulter', component: ConsulterMessagesComponent },
  { path: 'expert/expertise/vehicule', component: ExpertVehicleSelectionComponent },
  { path: 'expert/expertise/vehicule/degats', component: ExpertVehicleDamageComponent },
  { path: 'expert/reports/new', component: RapportExpertiseFormComponent },
  { path: 'expert/reports/stats', component: RapportStatistiquesDashboardComponent },

  // ============================================================
  // REDIRECTION PAR DÉFAUT
  // ============================================================
  { path: '**', redirectTo: '' }
];