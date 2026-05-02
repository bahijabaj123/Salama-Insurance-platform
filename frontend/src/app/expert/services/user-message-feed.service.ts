import { Injectable } from '@angular/core';

export interface UserMessageFeedItem {
  id: string;
  dossierId: number;
  dossierReference: string;
  expertName: string;
  clientName: string;
  from: 'CLIENT' | 'EXPERT';
  message: string;
  sentAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserMessageFeedService {
  private readonly storageKey = 'salama_user_message_feed_v1';
  private readonly maxItems = 200;

  list(): UserMessageFeedItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as UserMessageFeedItem[]) : [];
    } catch {
      return [];
    }
  }

  listAll(): UserMessageFeedItem[] {
    return this.list();
  }

  listRecentClientMessages(limit = 50): UserMessageFeedItem[] {
    return this.list()
      .filter((m) => m.from === 'CLIENT')
      .slice(0, limit);
  }

  /** Tous les messages d'un dossier, ordre chronologique (client + expert). */
  timelineForDossier(dossierId: number): UserMessageFeedItem[] {
    return this.list()
      .filter((m) => m.dossierId === dossierId)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }

  /** Réponses expert pour un dossier (chronologique). */
  expertRepliesForDossier(dossierId: number): UserMessageFeedItem[] {
    return this.list()
      .filter((m) => m.from === 'EXPERT' && m.dossierId === dossierId)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  }

  /**
   * Experts ayant au moins un message **client** (évite les noms issus seulement de réponses expert
   * sans fil client correspondant).
   */
  listDistinctExpertNames(): string[] {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const m of this.list()) {
      if (m.from !== 'CLIENT') continue;
      const raw = m.expertName?.trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      ordered.push(raw);
    }
    return ordered.sort((a, b) => a.localeCompare(b, 'fr'));
  }

  appendExpertMessage(item: Omit<UserMessageFeedItem, 'id' | 'from'>): boolean {
    const items = this.list();
    items.unshift({
      id: this.nextId(),
      from: 'EXPERT',
      ...item
    });
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items.slice(0, this.maxItems)));
      return true;
    } catch {
      return false;
    }
  }

  /** Message envoyé depuis l'espace client (même fil localStorage que la vue expert). */
  appendClientMessage(item: Omit<UserMessageFeedItem, 'id' | 'from'>): boolean {
    const items = this.list();
    items.unshift({
      id: this.nextId(),
      from: 'CLIENT',
      ...item
    });
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items.slice(0, this.maxItems)));
      return true;
    } catch {
      return false;
    }
  }

  private nextId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
