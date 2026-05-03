import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { ToastComponent } from './core/components/toast/toast.component';
import { authJwtInterceptor } from './core/auth/auth-jwt.interceptor';
import { routes } from './app.routes';
import { NotificationService } from './core/services/notification.service'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authJwtInterceptor])),
    NotificationService
  ]
};

