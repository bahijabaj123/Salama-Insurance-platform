import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  private currentAbortController?: () => void;

  constructor(private ngZone: NgZone) {}

  startListening(): Observable<string> {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return new Observable(observer => observer.error('Navigateur non supporté'));
    }

    // Interrompt toute écoute précédente (pour éviter les conflits)
    if (this.currentAbortController) {
      this.currentAbortController();
      this.currentAbortController = undefined;
    }

    return new Observable(observer => {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'fr-FR';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.ngZone.run(() => {
          observer.next(transcript);
          observer.complete();
        });
      };

      recognition.onerror = (event: any) => {
        this.ngZone.run(() => {
          let message = event.error;
          if (message === 'no-speech') message = 'Aucune parole détectée. Parlez immédiatement.';
          if (message === 'network') message = 'Microphone inaccessible. Vérifiez les permissions.';
          observer.error(message);
        });
      };

      recognition.onend = () => {
        // Si jamais on arrive à la fin sans résultat ni erreur
        if (!observer.closed) {
          this.ngZone.run(() => observer.complete());
        }
      };

      try {
        recognition.start();
      } catch (err) {
        observer.error('Impossible de démarrer la reconnaissance : ' + err);
        return;
      }

      // Fonction de nettoyage pour interrompre la reconnaissance si une nouvelle démarre
      const cleanup = () => {
        try { recognition.stop(); } catch(e) {}
      };
      this.currentAbortController = cleanup;

      // Quand l'observable se termine, on nettoie
      return () => {
        if (this.currentAbortController === cleanup) {
          this.currentAbortController = undefined;
        }
        cleanup();
      };
    });
  }

  stopListening(): void {
    if (this.currentAbortController) {
      this.currentAbortController();
      this.currentAbortController = undefined;
    }
  }
}