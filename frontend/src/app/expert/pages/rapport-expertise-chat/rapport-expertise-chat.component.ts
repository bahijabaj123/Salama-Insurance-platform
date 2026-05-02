import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { RapportExpertiseChatService } from '../../services/rapport-expertise-chat.service';
import { LocalChatbotService } from '../../services/local-chatbot.service';
import type { LocalPredictResult } from '../../services/local-chatbot/local-chatbot.types';
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
    { label: 'New report', prompt: '__NAV_RAPPORT_FORM__' },
    { label: 'List reports', prompt: '__ACTION_LIST_REPORTS__' },
    { label: 'Global statistics', prompt: '__NAV_STATS_DASHBOARD__' },
    { label: 'Help drafting conclusions', prompt: 'How should I write strong conclusions for an automotive expertise report?' }
  ];

  constructor(
    private rapportChat: RapportExpertiseChatService,
    private router: Router,
    private localChatbot: LocalChatbotService
  ) {}

  ngOnInit(): void {
    this.pushBot(this.welcomeText());
    this.verifyChatbotConnection();
    this.localChatbot.initFromAssets().subscribe({
      error: () => {
        /* fichier JSON optionnel */
      }
    });
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
      ? 'Checking...'
      : this.apiLinkState() === 'ok'
        ? 'API connected'
        : 'API unavailable';
  }

  private welcomeText(): string {
    return (
      'Hello — Expertise report chat. Use quick actions or ask your question.\n\n' +
      '— Local assistant (no API): greetings, experts, reports, stats…\n' +
      '— To teach a phrase: !learn hello | greeting'
    );
  }

  /** Sidebar label: local TF-IDF engine ready. */
  localEngineLabel(): string {
    return this.localChatbot.isReady() ? 'Local AI active' : 'Loading AI…';
  }

  private tryHandleLearnCommand(raw: string): boolean {
    const parsed = this.localChatbot.tryParseLearnCommand(raw);
    if (!parsed) return false;
    this.localChatbot.addTrainingExample(parsed.text, parsed.label);
    this.pushBot(
      `Example saved locally:\n« ${parsed.text} » → ${parsed.label}\n` +
        `(${this.localChatbot.customExampleCount()} custom example(s)). Try the phrase again.`,
    );
    return true;
  }

  /**
   * Domain replies for intents detected by the local chatbot (TF-IDF + Levenshtein).
   */
  private handleLocalPrediction(pred: LocalPredictResult): void {
    const confLine = `\n\n— Local confidence: ${Math.round(pred.confidence * 100)}% (close to « ${pred.matchedText} »)`;

    switch (pred.label) {
      case 'salutation':
        this.pushBot(`Hello 👋 I can help with reports, experts, or statistics.${confLine}`);
        break;
      case 'experts':
        this.runExpertsForLocalBot(confLine);
        break;
      case 'rapport':
        void this.router.navigateByUrl('/expert/reports/new');
        this.pushBot(`Opening the “New report” form.${confLine}`);
        break;
      case 'list_reports':
        this.runListReports();
        break;
      case 'stats':
        void this.router.navigateByUrl('/expert/reports/stats');
        this.pushBot(`Opening global statistics.${confLine}`);
        break;
      case 'help_conclusions':
        this.pushBot(this.helpConclusionsText() + confLine);
        break;
      default:
        this.pushBot(
          `I don’t understand this request well enough (score ${Math.round(pred.confidence * 100)}%, threshold ${Math.round(this.localChatbot.minConfidence * 100)}%). ` +
            `Rephrase or use the quick actions.`,
        );
    }
  }

  private helpConclusionsText(): string {
    return (
      'To write solid conclusions:\n' +
      '• summarize technical findings (vehicle, costing);\n' +
      '• tie them to documents and photos;\n' +
      '• state opinion / reservations clearly;\n' +
      '• propose indemnity or repair when relevant.'
    );
  }

  private runExpertsForLocalBot(confLine: string): void {
    this.sending.set(true);
    this.typing.set(true);
    this.rapportChat.getExperts().subscribe({
      next: (experts) => {
        this.typing.set(false);
        this.pushBot(this.formatExpertsList(experts ?? []) + confLine);
        this.sending.set(false);
      },
      error: () => {
        this.typing.set(false);
        this.pushBot('Could not load experts (API). Try again later.' + confLine);
        this.sending.set(false);
      }
    });
  }

  private formatExpertsList(experts: Expert[]): string {
    if (!experts.length) return 'No experts in the database yet.';
    return experts
      .slice(0, 30)
      .map(
        (e) =>
          `• ${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() +
          (e.specialty ? ` — ${e.specialty}` : '') +
          (e.city ? ` (${e.city})` : '') +
          (e.status ? ` [${e.status}]` : ''),
      )
      .join('\n');
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
      this.onSuggestion({ label: 'List reports', prompt: '__ACTION_LIST_REPORTS__' });
      return;
    }
    if (target === 'settings') {
      this.verifyChatbotConnection();
      return;
    }
    this.pushBot('AI dashboard ready.');
  }

  onSend(): void {
    const t = this.inputText.trim();
    if (!t || this.sending()) return;
    this.inputText = '';
    this.pushUser(t);

    if (this.tryHandleLearnCommand(t)) {
      return;
    }

    if (this.localChatbot.isReady()) {
      const pred = this.localChatbot.predict(t);
      if (!pred.belowThreshold) {
        this.handleLocalPrediction(pred);
        return;
      }
    }

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
    const hasReport = s.includes('rapport') || s.includes('report');
    if (!hasReport) return false;
    return /^(ajoute|ajouter|creer|créer|nouveau|add|create|new)\b/.test(s);
  }

  private parseExpertIdFromMessage(text: string): number | undefined {
    const m = text.match(/\bexpert\s*[:#]?\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : undefined;
  }

  private parseAssureFromMessage(text: string): string | undefined {
    const m = text.match(/\b(?:assur[eé]?|insured)\s*:\s*(.+)$/i);
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
          this.pushBot('No expert available to create a report.');
          this.sending.set(false);
          return;
        }
        const payload = buildFullExpertiseReportPayload(assure ? { assureNom: assure } : undefined);
        this.rapportChat.createReport(expert.idExpert, payload).subscribe({
          next: (r) => {
            this.typing.set(false);
            this.pushBot(`Report created.\n\n${this.formatReport(r)}`);
            this.sending.set(false);
          },
          error: () => {
            this.typing.set(false);
            this.pushBot('Failed to create the report.');
            this.sending.set(false);
          }
        });
      },
      error: () => {
        this.typing.set(false);
        this.pushBot('Could not load experts.');
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
        this.pushBot('Could not load the report list.');
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
        this.pushBot(`Reference "${ref}" not found.`);
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
        this.pushBot(res?.message?.trim() || 'Empty response from the server.');
        this.sending.set(false);
      },
      error: () => {
        this.typing.set(false);
        this.pushBot('Error calling the assistant.');
        this.sending.set(false);
      }
    });
  }

  clearChat(): void {
    this.messages.set([]);
    this.pushBot(this.welcomeText());
  }

  private formatReport(r: ExpertiseReport): string {
    const lines: string[] = ['Expertise report'];
    if (r.numeroReference) lines.push(`Ref.: ${r.numeroReference}`);
    if (r.assureNom) lines.push(`Insured: ${r.assureNom}`);
    if (r.vehiculeMarque || r.vehiculeImmatriculation) {
      lines.push(`Vehicle: ${[r.vehiculeMarque, r.vehiculeType].filter(Boolean).join(' ')} ${r.vehiculeImmatriculation ? `(${r.vehiculeImmatriculation})` : ''}`.trim());
    }
    if (r.conclusions) lines.push(`Conclusions: ${r.conclusions}`);
    return lines.join('\n');
  }

  private formatReportsList(list: ExpertiseReport[]): string {
    if (!list.length) return 'No expertise reports in the database yet.';
    return list.slice(0, 20)
      .map((r, i) => `• ${r.numeroReference ?? `#${r.idRapport ?? i + 1}`} ${r.assureNom ? `— ${r.assureNom}` : ''}`)
      .join('\n');
  }
}
