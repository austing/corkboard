import type { ScrapWithUser } from '../types';

export class ScrapPermissions {
  /**
   * Check if a user can edit a specific scrap
   */
  static canEdit(scrap: ScrapWithUser, userId?: string): boolean {
    if (!userId) return false;
    return scrap.userId === userId;
  }

  /**
   * Check if a user can view a specific scrap
   */
  static canView(scrap: ScrapWithUser, userId?: string): boolean {
    return scrap.visible || this.canEdit(scrap, userId);
  }

  /**
   * Check if a user can delete a specific scrap
   */
  static canDelete(scrap: ScrapWithUser, userId?: string): boolean {
    return this.canEdit(scrap, userId);
  }

  /**
   * Filter scraps to only include those viewable by the user
   */
  static filterViewableScraps(scraps: ScrapWithUser[], userId?: string): ScrapWithUser[] {
    return scraps.filter(scrap => this.canView(scrap, userId));
  }

  /**
   * Check if a user owns a scrap
   */
  static isOwner(scrap: ScrapWithUser, userId?: string): boolean {
    return !!userId && scrap.userId === userId;
  }

  /**
   * Get user-specific scraps
   */
  static getUserScraps(scraps: ScrapWithUser[], userId: string): ScrapWithUser[] {
    return scraps.filter(scrap => scrap.userId === userId);
  }

  /**
   * Get public scraps only
   */
  static getPublicScraps(scraps: ScrapWithUser[]): ScrapWithUser[] {
    return scraps.filter(scrap => scrap.visible);
  }
};

// Legacy export for backwards compatibility
export const ScrapPermissionsLegacy = {
  canEdit(scrap: ScrapWithUser, userId?: string): boolean {
    return ScrapPermissions.canEdit(scrap, userId);
  },

  canView(scrap: ScrapWithUser, userId?: string): boolean {
    return ScrapPermissions.canView(scrap, userId);
  },

  canDelete(scrap: ScrapWithUser, userId?: string): boolean {
    return ScrapPermissions.canDelete(scrap, userId);
  },

  filterViewableScraps(scraps: ScrapWithUser[], userId?: string): ScrapWithUser[] {
    return ScrapPermissions.filterViewableScraps(scraps, userId);
  }
};