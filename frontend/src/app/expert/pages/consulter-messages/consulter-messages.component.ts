import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { UserMessageFeedItem, UserMessageFeedService } from '../../services/user-message-feed.service';

@Component({
  selector: 'app-consulter-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './consulter-messages.component.html',
  styleUrl: './consulter-messages.component.scss'
})
export class ConsulterMessagesComponent implements OnInit, OnDestroy {
  userMessages = signal<UserMessageFeedItem[]>([]);
  allMessages = signal<UserMessageFeedItem[]>([]);
  replyDrafts = signal<Record<string, string>>({});
  successMessage = signal('');
  /** Sur `/expert/consulter` uniquement : expert choisi dans la liste avant navigation. */
  selectedExpertForNav = '';
  /** Nom d'expert décodé depuis l'URL `/expert/consulter/thread/:expertKey` (null = vue hub). */
  threadExpertName = signal<string | null>(null);

  private routeSub?: Subscription;

  constructor(
    private userMessageFeed: UserMessageFeedService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((pm) => {
      const raw = pm.get('expertKey');
      this.threadExpertName.set(raw ?? null);
      this.loadUserMessages();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  expertChoices(): string[] {
    return this.userMessageFeed.listDistinctExpertNames();
  }

  goToExpertThread(): void {
    const name = this.selectedExpertForNav.trim();
    if (!name) return;
    void this.router.navigate(['/expert/consulter/thread', name]);
  }

  loadUserMessages(): void {
    const expert = this.threadExpertName();
    const norm = (s: string) => s.trim().toLowerCase();
    let clients = this.userMessageFeed.listRecentClientMessages(200);
    if (expert) {
      clients = clients.filter((m) => norm(m.expertName || '') === norm(expert));
    } else {
      clients = clients.slice(0, 24);
    }
    this.userMessages.set(clients);
    this.allMessages.set(this.userMessageFeed.listAll());
  }

  messageTimeLabel(sentAt: string): string {
    const d = new Date(sentAt);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getReplyDraft(messageId: string): string {
    return this.replyDrafts()[messageId] ?? '';
  }

  setReplyDraft(messageId: string, value: string): void {
    this.replyDrafts.update((d) => ({ ...d, [messageId]: value }));
  }

  sendReply(message: UserMessageFeedItem): void {
    const text = this.getReplyDraft(message.id).trim();
    if (!text) return;

    this.userMessageFeed.appendExpertMessage({
      dossierId: message.dossierId,
      dossierReference: message.dossierReference,
      expertName: message.expertName,
      clientName: message.clientName,
      message: text,
      sentAt: new Date().toISOString()
    });

    this.replyDrafts.update((d) => ({ ...d, [message.id]: '' }));
    this.successMessage.set(`Réponse envoyée pour le dossier ${message.dossierReference}.`);
    setTimeout(() => this.successMessage.set(''), 2200);
    this.loadUserMessages();
  }

  /** Réponses expert pour un dossier, ordre chronologique. */
  expertRepliesFor(message: UserMessageFeedItem): UserMessageFeedItem[] {
    return this.allMessages()
      .filter((m) => m.from === 'EXPERT' && m.dossierId === message.dossierId)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }

  /** Fil chronologique client puis experts pour un même dossier (affichage type chat). */
  dossierTimeline(anchor: UserMessageFeedItem): UserMessageFeedItem[] {
    return [anchor, ...this.expertRepliesFor(anchor)];
  }

  expertInitials(name: string | null): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
    }
    return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
  }
}
