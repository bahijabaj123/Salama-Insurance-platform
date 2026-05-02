import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { RapportExpertiseChatService } from '../../services/rapport-expertise-chat.service';
import { ExpertiseReport } from '../../models/expertise-report.model';
import { Expert } from '../../models/expert.model';
import { buildFullExpertiseReportPayload } from '../../data/full-expertise-report.template';

interface ChatLine {
  text: string;
  isUser: boolean;
  time: string;
}

@Component({
  selector: 'app-rapport-expertise-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './rapport-expertise-chat.component.html',
  styleUrl: './rapport-expertise-chat.component.scss'
})
export class RapportExpertiseChatComponent implements OnInit {
  @ViewChild('messagesEnd') private messagesEnd?: ElementRef<HTMLDivElement>;

  messages = signal<ChatLine[]>([]);
  inputText = '';
  sending = signal(false);
  typing = signal(false);
  activeNav = signal<'dashboard' | 'reports' | 'experts' | 'stats' | 'settings'>('dashboard');
  apiLinkState = signal<'checking' | 'ok' | 'error'>('checking');

  readonly suggestions = [
    { label: 'Nouveau rapport', prompt: '__NAV_RAPPORT_FORM__' },
    { label: 'Lister les rapports', prompt: '__ACTION_LIST_REPORTS__' },
    { label: 'Statistiques globales', prompt: '__NAV_STATS_DASHBOARD__' },
    { label: 'Aide redaction conclusions', prompt: 'Comment bien rediger les conclusions d’un rapport d’expertise automobile ?' }
  ];

  constructor(
    private rapportChat: RapportExpertiseChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.pushBot(this.welcomeText());
    this.verifyChatbotConnection();
  }

  verifyChatbotConnection(): void {
    this.apiLinkState.set('checking');
    this.rapportChat.checkChatbotConnection().subscribe({
      next: (body) => {
        const ok = typeof body === 'string' && body.toLowerCase().includes('working');
        this.apiLinkState.set(ok ? 'ok' : 'error');
      },
      error: () => this.apiLinkState.set('error')
    });
  }

  apiStatusLabel(): string {
    return this.apiLinkState() === 'checking'
      ? 'Verification...'
      : this.apiLinkState() === 'ok'
        ? 'API connectee'
        : 'API indisponible';
  }

  private welcomeText(): string {
    return 'Bonjour, espace Rapport expertise chat. Utilisez les actions rapides ou posez votre question.';
  }

  private nowTime(): string {
    const n = new Date();
    return `${n.getHours().toString().padStart(2, '0')}:${n.getMinutes().toString().padStart(2, '0')}`;
  }

  private pushUser(text: string): void {
    this.messages.update((m) => [...m, { text, isUser: true, time: this.nowTime() }]);
    this.scrollBottom();
  }

  private pushBot(text: string): void {
    this.messages.update((m) => [...m, { text, isUser: false, time: this.nowTime() }]);
    this.scrollBottom();
  }

  private scrollBottom(): void {
    setTimeout(() => this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' }), 80);
  }

  onSuggestion(s: { label: string; prompt: string }): void {
    if (this.sending()) return;
    if (s.prompt === '__NAV_RAPPORT_FORM__') {
      void this.router.navigateByUrl('/expert/reports/new');
      return;
    }
    if (s.prompt === '__NAV_STATS_DASHBOARD__') {
      void this.router.navigateByUrl('/expert/reports/stats');
      return;
    }
    this.pushUser(s.label);
    if (s.prompt === '__ACTION_LIST_REPORTS__') {
      this.runListReports();
      return;
    }
    this.runChatbot(s.prompt);
  }

  onNavAction(target: 'dashboard' | 'reports' | 'experts' | 'stats' | 'settings'): void {
    this.activeNav.set(target);
    if (target === 'experts') {
      void this.router.navigateByUrl('/expert/dashboard');
      return;
    }
    if (target === 'stats') {
      void this.router.navigateByUrl('/expert/reports/stats');
      return;
    }
    if (target === 'reports') {
      this.onSuggestion({ label: 'Lister les rapports', prompt: '__ACTION_LIST_REPORTS__' });
      return;
    }
    if (target === 'settings') {
      this.verifyChatbotConnection();
      return;
    }
    this.pushBot('Dashboard IA pret.');
  }

  onSend(): void {
    const t = this.inputText.trim();
    if (!t || this.sending()) return;
    this.inputText = '';
    this.pushUser(t);

    const refMatch = t.match(/^(réf|ref)\s*:\s*(.+)$/i);
    if (refMatch) {
      this.runLoadByReference(refMatch[2].trim());
      return;
    }

    if (this.isAddReportIntent(t)) {
      this.runCreateReportFromMessage(t);
      return;
    }

    this.runChatbot(t);
  }

  private isAddReportIntent(text: string): boolean {
    const s = text.trim().toLowerCase();
    if (!s.includes('rapport')) return false;
    return /^(ajoute|ajouter|creer|créer|nouveau)\b/.test(s);
  }

  private parseExpertIdFromMessage(text: string): number | undefined {
    const m = text.match(/\bexpert\s*[:#]?\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : undefined;
  }

  private parseAssureFromMessage(text: string): string | undefined {
    const m = text.match(/\bassur[eé]?\s*:\s*(.+)$/i);
    return m?.[1]?.trim() || undefined;
  }

  private pickExpertForReport(experts: Expert[], idOpt?: number): Expert | null {
    if (!experts.length) return null;
    if (idOpt != null) {
      const found = experts.find((e) => e.idExpert === idOpt);
      if (found) return found;
    }
    const active = experts.find((e) => e.status === 'ACTIVE');
    return active ?? experts[0];
  }

  private runCreateReportFromMessage(message: string): void {
    this.sending.set(true);
    this.typing.set(true);
    const expertIdOpt = this.parseExpertIdFromMessage(message);
    const assure = this.parseAssureFromMessage(message);

    this.rapportChat.getExperts().subscribe({
      next: (experts) => {
        const expert = this.pickExpertForReport(experts ?? [], expertIdOpt);
        if (!expert?.idExpert) {
          this.typing.set(false);
          this.pushBot("Aucun expert disponible pour creer un rapport.");
          this.sending.set(false);
          return;
        }
        const payload = buildFullExpertiseReportPayload(assure ? { assureNom: assure } : undefined);
        this.rapportChat.createReport(expert.idExpert, payload).subscribe({
          next: (r) => {
            this.typing.set(false);
            this.pushBot(`Rapport cree.\n\n${this.formatReport(r)}`);
            this.sending.set(false);
          },
          error: () => {
            this.typing.set(false);
            this.pushBot("Echec de creation du rapport.");
            this.sending.set(false);
          }
        });
      },
      error: () => {
        this.typing.set(false);
        this.pushBot("Impossible de charger les experts.");
        this.sending.set(false);
      }
    });
  }

  private runListReports(): void {
    this.sending.set(true);
    this.typing.set(true);
    this.rapportChat.getAllReports().subscribe({
      next: (list) => {
        this.typing.set(false);
        this.pushBot(this.formatReportsList(list ?? []));
        this.sending.set(false);
      },
      error: () => {
        this.typing.set(false);
        this.pushBot("Impossible de charger la liste des rapports.");
        this.sending.set(false);
      }
    });
  }

  private runLoadByReference(ref: string): void {
    this.sending.set(true);
    this.typing.set(true);
    this.rapportChat.getByReference(ref).subscribe({
      next: (r) => {
        this.typing.set(false);
        this.pushBot(this.formatReport(r));
        this.sending.set(false);
      },
      error: () => {
        this.typing.set(false);
        this.pushBot(`Reference "${ref}" introuvable.`);
        this.sending.set(false);
      }
    });
  }

  private runChatbot(message: string): void {
    this.sending.set(true);
    this.typing.set(true);
    this.rapportChat.sendExpertChat(message).subscribe({
      next: (res) => {
        this.typing.set(false);
        this.pushBot(res?.message?.trim() || 'Reponse vide du serveur.');
        this.sending.set(false);
      },
      error: () => {
        this.typing.set(false);
        this.pushBot('Erreur lors de l’appel a l’assistant.');
        this.sending.set(false);
      }
    });
  }

  clearChat(): void {
    this.messages.set([]);
    this.pushBot(this.welcomeText());
  }

  private formatReport(r: ExpertiseReport): string {
    const lines: string[] = ['Rapport d’expertise'];
    if (r.numeroReference) lines.push(`Ref.: ${r.numeroReference}`);
    if (r.assureNom) lines.push(`Assure: ${r.assureNom}`);
    if (r.vehiculeMarque || r.vehiculeImmatriculation) {
      lines.push(`Vehicule: ${[r.vehiculeMarque, r.vehiculeType].filter(Boolean).join(' ')} ${r.vehiculeImmatriculation ? `(${r.vehiculeImmatriculation})` : ''}`.trim());
    }
    if (r.conclusions) lines.push(`Conclusions: ${r.conclusions}`);
    return lines.join('\n');
  }

  private formatReportsList(list: ExpertiseReport[]): string {
    if (!list.length) return 'Aucun rapport d’expertise en base pour le moment.';
    return list.slice(0, 20)
      .map((r, i) => `• ${r.numeroReference ?? `#${r.idRapport ?? i + 1}`} ${r.assureNom ? `— ${r.assureNom}` : ''}`)
      .join('\n');
  }
}
