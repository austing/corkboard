import type { Scrap } from '../lib/api';

export const ScrapPermissions = {
  canEdit(scrap: Scrap, userId?: string): boolean {
    return !!userId && scrap.userId === userId;
  },

  canView(scrap: Scrap, userId?: string): boolean {
    return scrap.visible || this.canEdit(scrap, userId);
  },

  canDelete(scrap: Scrap, userId?: string): boolean {
    return this.canEdit(scrap, userId);
  },

  filterViewableScraps(scraps: Scrap[], userId?: string): Scrap[] {
    return scraps.filter(scrap => this.canView(scrap, userId));
  }
};