import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { ApplicationConfig } from '@angular/core';

export const appConfig: ApplicationConfig= {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    // ... autres providers
  ]
};