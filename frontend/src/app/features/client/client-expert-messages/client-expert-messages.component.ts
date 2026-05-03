import { Component, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import { ClaimService } from '../../../core/services/claim.service';
import { Claim, expertFullName, getClaimExpert } from '../../../core/models/claim.model';
import { ExpertService } from '../../../expert/services/expert.service';
import { UserMessageFeedItem, UserMessageFeedService } from '../../../expert/services/user-message-feed.service';

/**
 * Même logique métier que le bloc « Messages déjà envoyés par l'utilisateur »
 * du dashboard expert (`ExpertDashboardComponent`) : fil localStorage partagé.
 */
@Component({
  selector: 'app-client-expert-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './client-expert-messages.component.html',
  styleUrl: './client-expert-messages.component.scss',
})
export class ClientExpertMessagesComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly auth = inject(AuthStorageService);
  private readonly feed = inject(UserMessageFeedService);
  private readonly claimsApi = inject(ClaimService);
  private readonly expertService = inject(ExpertService);
  private readonly router = inject(Router);

  /** Affichage intégré dans le tableau de bord client : pas de bouton Retour, fond neutre. */
  readonly embedded = input(false);

  private static dlSeq = 0;

  /** Id unique pour le datalist (évite les collisions si plusieurs instances). */
  readonly expertDatalistId = `cem-expert-dl-${ClientExpertMessagesComponent.dlSeq++}`;

  readonly clientLabel = computed(() => {
    const u = this.auth.getUser();
    return (u?.fullName || u?.email || 'Client').trim();
  });

  myClaims = signal<Claim[]>([]);
  loadingClaims = signal(true);

  /** Une carte par dossier (dernier message client visible comme sur le dashboard expert). */
  anchors = signal<UserMessageFeedItem[]>([]);

  selectedClaimId: number | null = null;
  newMessageText = '';
  sendSuccess = signal('');
  sendError = signal('');

  /** Suite de conversation par dossier (comme « Répondre au client » côté expert). */
  private threadDraftByDossier: Record<number, string> = {};

  /** Si aucun sinistre API : envoi manuel (démo / hors contrat). L’ID technique du fil est dérivé de référence + expert. */
  manualReference = '';
  manualExpertName = '';

  /** Noms d'experts renvoyés par l'API (la liste déroulante ne dépend plus seulement du fil local). */
  expertsFromApi = signal<string[]>([]);

  ngOnInit(): void {
    this.refreshAnchors();
    this.loadExpertDirectory();
    this.loadClaims();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  expertChoices(): string[] {
    return this.feed.listDistinctExpertNames();
  }

  /** Experts connus du fil local + annuaire API (saisie libre possible via le champ texte). */
  manualExpertOptions(): string[] {
    const fromFeed = this.expertChoices();
    const fromApi = this.expertsFromApi();
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of [...fromFeed, ...fromApi]) {
      const n = raw.trim();
      const k = n.toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(n);
    }
    return out.sort((a, b) => a.localeCompare(b, 'en'));
  }

  private loadExpertDirectory(): void {
    this.expertService
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (experts) => {
          const names = experts
            .map((e) => `${(e.firstName || '').trim()} ${(e.lastName || '').trim()}`.trim())
            .filter((n) => n.length > 0);
          this.expertsFromApi.set(names);
          this.tryApplyManualDefaults();
        },
        error: () => this.expertsFromApi.set([]),
      });
  }

  /** Sans sinistre : préremplit l’expert s’il n’y en a qu’un dans l’annuaire / le fil. */
  private tryApplyManualDefaults(): void {
    if (this.myClaims().length > 0) return;
    const opts = this.manualExpertOptions();
    if (opts.length === 1 && !this.manualExpertName.trim()) {
      this.manualExpertName = opts[0]!;
    }
  }

  private claimIdSet(): Set<number> {
    return new Set(this.myClaims().map((c) => c.id));
  }

  private clientIdentityMatches(storedName: string): boolean {
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
    const a = norm(storedName);
    if (!a) return false;
    const user = this.auth.getUser();
    const candidates: string[] = [];
    if (user?.fullName?.trim()) candidates.push(user.fullName);
    if (user?.email?.trim()) {
      candidates.push(user.email);
      const local = user.email.split('@')[0]?.trim();
      if (local) candidates.push(local);
    }
    candidates.push(this.clientLabel());
    const seen = new Set<string>();
    for (const c of candidates) {
      const b = norm(c);
      if (!b || seen.has(b)) continue;
      seen.add(b);
      if (a === b) return true;
      if (a.length >= 3 && b.length >= 3 && (a.includes(b) || b.includes(a))) return true;
    }
    return false;
  }

  private messageVisibleToClient(m: UserMessageFeedItem): boolean {
    if (m.from !== 'CLIENT') return false;
    const ids = this.claimIdSet();
    if (ids.size > 0 && ids.has(m.dossierId)) return true;
    return this.clientIdentityMatches(m.clientName || '');
  }

  /** Identifiant numérique stable pour regrouper le fil (référence + expert), sans saisie utilisateur. */
  private stableManualDossierId(reference: string, expertName: string): number {
    const s = `${reference.trim().toLowerCase()}|${expertName.trim().toLowerCase()}`;
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    }
    const n = Math.abs(h);
    return n > 0 ? n : 1;
  }

  refreshAnchors(): void {
    const recent = this.feed.listRecentClientMessages(200);
    const filtered = recent.filter((m) => this.messageVisibleToClient(m));
    const byDossier = new Map<number, UserMessageFeedItem>();
    for (const m of filtered) {
      const prev = byDossier.get(m.dossierId);
      if (!prev || new Date(m.sentAt).getTime() > new Date(prev.sentAt).getTime()) {
        byDossier.set(m.dossierId, m);
      }
    }
    const list = [...byDossier.values()].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    );
    this.anchors.set(list.slice(0, 16));
  }

  private loadClaims(): void {
    const user = this.auth.getUser();
    const clientId = user?.id;
    const clientEmail = user?.email;

    this.claimsApi
      .getAllClaims()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingClaims.set(false);
          this.refreshAnchors();
        }),
      )
      .subscribe({
        next: (claims) => {
          let mine: Claim[];
          if (clientId) {
            mine = claims.filter((c) => c.client?.id === clientId);
          } else if (clientEmail) {
            mine = claims.filter((c) => c.client?.email === clientEmail);
          } else {
            mine = claims;
          }
          this.myClaims.set(mine);
          if (this.selectedClaimId == null && mine.length) {
            this.selectedClaimId = mine[0].id;
          }
          this.tryApplyManualDefaults();
        },
        error: () => {
          this.myClaims.set([]);
          this.tryApplyManualDefaults();
        },
      });
  }

  refreshAll(): void {
    this.refreshAnchors();
  }

  messageTimeLabel(sentAt: string): string {
    const d = new Date(sentAt);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  expertRepliesFor(msg: UserMessageFeedItem): UserMessageFeedItem[] {
    return this.feed.expertRepliesForDossier(msg.dossierId);
  }

  getThreadDraft(dossierId: number): string {
    return this.threadDraftByDossier[dossierId] ?? '';
  }

  setThreadDraft(dossierId: number, value: string): void {
    this.threadDraftByDossier = { ...this.threadDraftByDossier, [dossierId]: value };
  }

  sendClientFollowUp(msg: UserMessageFeedItem): void {
    const text = this.getThreadDraft(msg.dossierId).trim();
    if (!text) return;
    const ok = this.feed.appendClientMessage({
      dossierId: msg.dossierId,
      dossierReference: msg.dossierReference,
      expertName: msg.expertName,
      clientName: this.clientLabel(),
      message: text,
      sentAt: new Date().toISOString(),
    });
    if (!ok) {
      this.sendError.set(
        'Could not save (browser storage denied or full). Messages are not sent to the server.',
      );
      return;
    }
    this.threadDraftByDossier = { ...this.threadDraftByDossier, [msg.dossierId]: '' };
    this.sendSuccess.set(`Message sent for case ${msg.dossierReference}.`);
    setTimeout(() => this.sendSuccess.set(''), 2500);
    this.refreshAnchors();
  }

  sendNewMessage(): void {
    this.sendError.set('');
    this.sendSuccess.set('');
    const text = this.newMessageText.trim();
    if (!text) {
      this.sendError.set('Enter a message.');
      return;
    }

    const mine = this.myClaims();
    let saved = false;

    if (mine.length > 0) {
      if (this.selectedClaimId == null) {
        this.sendError.set('Select a case (claim).');
        return;
      }
      const claim = mine.find((c) => c.id === this.selectedClaimId);
      if (!claim) {
        this.sendError.set('Case not found.');
        return;
      }
      const expert = getClaimExpert(claim);
      const expertName = expert ? expertFullName(expert) : 'Expert Salama';
      saved = this.feed.appendClientMessage({
        dossierId: claim.id,
        dossierReference: claim.reference,
        expertName,
        clientName: this.clientLabel(),
        message: text,
        sentAt: new Date().toISOString(),
      });
    } else {
      const missing: string[] = [];
      if (!this.manualReference.trim()) {
        missing.push('case reference');
      }
      if (!this.manualExpertName.trim()) {
        missing.push("expert name (list, free text, or same spelling as in the expert app)");
      }
      if (missing.length) {
        this.sendError.set(
          `Cannot send: fill in ${missing.join(', ')}. With no claim linked to the account, these fields are required.`,
        );
        return;
      }
      const ref = this.manualReference.trim();
      const exp = this.manualExpertName.trim();
      saved = this.feed.appendClientMessage({
        dossierId: this.stableManualDossierId(ref, exp),
        dossierReference: ref,
        expertName: exp,
        clientName: this.clientLabel(),
        message: text,
        sentAt: new Date().toISOString(),
      });
    }

    if (!saved) {
      this.sendError.set(
        'Could not save (browser storage denied or full). Messages stay local to this browser: client and coordinator must use the same device/browser for the demo.',
      );
      return;
    }

    this.newMessageText = '';
    this.sendSuccess.set(
      'Message saved. It appears under “View client messages” on the expert side in this same browser.',
    );
    setTimeout(() => this.sendSuccess.set(''), 4000);
    this.refreshAnchors();
  }

  goBack(): void {
    if (this.embedded()) return;
    void this.router.navigate(['/client/consultation-expert']);
  }
}
