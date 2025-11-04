import { Injectable, signal } from '@angular/core';

export interface SubscriptionInfo {
  type: 'default' | 'premium';
  maxProjects: number;
  maxUndoRedo: number;
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  // Observable state
  readonly subscription$ = signal<SubscriptionInfo>({
    type: 'default',
    maxProjects: 1,
    maxUndoRedo: 5,
  });

  // Get current subscription info
  getCurrentSubscription(): SubscriptionInfo {
    return this.subscription$();
  }

  // Update subscription (would be called from API responses)
  updateSubscription(subscription: SubscriptionInfo): void {
    this.subscription$.set(subscription);
  }

  // Check if user has premium subscription
  isPremium(): boolean {
    return this.subscription$().type === 'premium';
  }

  // Get project limit for current subscription
  getProjectLimit(): number {
    return this.subscription$().maxProjects;
  }

  // Get undo/redo limit for current subscription
  getUndoRedoLimit(): number {
    return this.subscription$().maxUndoRedo;
  }
}
