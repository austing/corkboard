import type { ScrapWithUser, Position, Size, Bounds } from '../types';

export class CanvasUtils {
  private static readonly DEFAULT_SCRAP_WIDTH = 300;
  private static readonly DEFAULT_SCRAP_HEIGHT = 200;
  private static readonly DEFAULT_PADDING = 100;
  static getCanvasBounds(scraps: ScrapWithUser[]): Bounds {
    if (scraps.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const scrapWidth = this.DEFAULT_SCRAP_WIDTH;
    const scrapHeight = this.DEFAULT_SCRAP_HEIGHT;

    const bounds = scraps.reduce(
      (acc, scrap) => ({
        minX: Math.min(acc.minX, scrap.x),
        maxX: Math.max(acc.maxX, scrap.x + scrapWidth),
        minY: Math.min(acc.minY, scrap.y),
        maxY: Math.max(acc.maxY, scrap.y + scrapHeight),
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    // Include origin in bounds
    bounds.minX = Math.min(bounds.minX, 0);
    bounds.minY = Math.min(bounds.minY, 0);
    bounds.maxX = Math.max(bounds.maxX, 0);
    bounds.maxY = Math.max(bounds.maxY, 0);

    return bounds;
  }

  static pageToCanvasCoordinates(
    pageX: number,
    pageY: number,
    scraps: ScrapWithUser[],
    padding: number = this.DEFAULT_PADDING
  ): Position {
    const minX = scraps.length > 0 ? Math.min(0, ...scraps.map(s => s.x)) : 0;
    const minY = scraps.length > 0 ? Math.min(0, ...scraps.map(s => s.y)) : 0;
    
    return {
      x: Math.max(0, Math.round(pageX + minX - padding)),
      y: Math.max(0, Math.round(pageY + minY - padding))
    };
  }

  static getScrapDisplayPosition(
    scrap: ScrapWithUser, 
    scraps: ScrapWithUser[], 
    padding: number = this.DEFAULT_PADDING
  ): Position {
    if (scraps.length === 0) return { x: scrap.x, y: scrap.y };
    
    const minX = Math.min(0, ...scraps.map(s => s.x));
    const minY = Math.min(0, ...scraps.map(s => s.y));
    
    return { 
      x: scrap.x - minX + padding, 
      y: scrap.y - minY + padding 
    };
  }

  static calculateCanvasSize(
    scraps: ScrapWithUser[],
    padding: number = this.DEFAULT_PADDING
  ): Size {
    if (scraps.length === 0) {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }

    const bounds = this.getCanvasBounds(scraps);
    const canvasWidth = bounds.maxX - bounds.minX + (2 * padding);
    const canvasHeight = bounds.maxY - bounds.minY + (2 * padding);

    // Ensure canvas is at least viewport size for better UX
    return {
      width: Math.max(canvasWidth, window.innerWidth),
      height: Math.max(canvasHeight, window.innerHeight)
    };
  }
}