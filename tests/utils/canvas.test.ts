/**
 * Unit tests for canvas utility functions
 * These would typically be in a separate utils file, but are shown here as examples
 */

describe('Canvas Utilities', () => {
  describe('calculateCanvasSize', () => {
    it('should calculate correct canvas size with positive coordinates', () => {
      const scraps = [
        { x: 100, y: 200 },
        { x: 500, y: 300 },
        { x: 200, y: 100 },
      ]
      
      const scrapWidth = 300
      const scrapHeight = 200
      const padding = 100
      
      const result = calculateCanvasSize(scraps, scrapWidth, scrapHeight, padding)
      
      // Max bounds: x: 500+300=800, y: 300+200=500
      // Min bounds: x: 100, y: 100
      // Canvas: (800-100) + 200 = 900, (500-100) + 200 = 600
      expect(result).toEqual({ width: 900, height: 600 })
    })

    it('should handle negative coordinates correctly', () => {
      const scraps = [
        { x: -100, y: -50 },
        { x: 200, y: 150 },
      ]
      
      const scrapWidth = 300
      const scrapHeight = 200
      const padding = 100
      
      const result = calculateCanvasSize(scraps, scrapWidth, scrapHeight, padding)
      
      // Include origin (0,0) in bounds
      // Min: x: -100, y: -50, Max: x: 500, y: 350
      // Canvas: (500-(-100)) + 200 = 800, (350-(-50)) + 200 = 600
      expect(result).toEqual({ width: 800, height: 600 })
    })

    it('should return minimum size when no scraps', () => {
      const scraps: any[] = []
      const result = calculateCanvasSize(scraps, 300, 200, 100)
      
      expect(result).toEqual({ width: 1000, height: 800 }) // Minimum viewport size
    })
  })

  describe('getScrapPosition', () => {
    it('should adjust position for negative coordinates', () => {
      const scrap = { x: 150, y: 250 }
      const allScraps = [
        { x: -100, y: -50 },
        { x: 150, y: 250 },
        { x: 300, y: 100 },
      ]
      const padding = 100
      
      const result = getScrapPosition(scrap, allScraps, padding)
      
      // Min coordinates: x: -100, y: -50
      // Adjusted: x: 150-(-100)+100 = 350, y: 250-(-50)+100 = 400
      expect(result).toEqual({ x: 350, y: 400 })
    })

    it('should handle all positive coordinates', () => {
      const scrap = { x: 200, y: 300 }
      const allScraps = [
        { x: 100, y: 200 },
        { x: 200, y: 300 },
        { x: 400, y: 150 },
      ]
      const padding = 100
      
      const result = getScrapPosition(scrap, allScraps, padding)
      
      // Min coordinates: x: 0 (include origin), y: 0
      // Adjusted: x: 200-0+100 = 300, y: 300-0+100 = 400
      expect(result).toEqual({ x: 300, y: 400 })
    })
  })

  describe('convertClickToCanvasCoordinates', () => {
    it('should convert page coordinates to canvas coordinates', () => {
      const clickX = 500
      const clickY = 400
      const allScraps = [
        { x: -100, y: -50 },
        { x: 200, y: 150 },
      ]
      const padding = 100
      
      const result = convertClickToCanvasCoordinates(clickX, clickY, allScraps, padding)
      
      // Min coordinates: x: -100, y: -50
      // Canvas coords: x: 500+(-100)-100 = 300, y: 400+(-50)-100 = 250
      expect(result).toEqual({ x: 300, y: 250 })
    })

    it('should ensure minimum coordinates of 0', () => {
      const clickX = 50
      const clickY = 30
      const allScraps = [{ x: 100, y: 200 }]
      const padding = 100
      
      const result = convertClickToCanvasCoordinates(clickX, clickY, allScraps, padding)
      
      // Would result in negative coordinates, should be clamped to 0
      expect(result.x).toBeGreaterThanOrEqual(0)
      expect(result.y).toBeGreaterThanOrEqual(0)
    })
  })
})

// Mock implementation functions that would be in actual utils
function calculateCanvasSize(scraps: any[], scrapWidth: number, scrapHeight: number, padding: number) {
  if (scraps.length === 0) {
    return { width: Math.max(1000, window?.innerWidth || 1000), height: Math.max(800, window?.innerHeight || 800) }
  }

  const bounds = scraps.reduce(
    (acc, scrap) => ({
      minX: Math.min(acc.minX, scrap.x),
      maxX: Math.max(acc.maxX, scrap.x + scrapWidth),
      minY: Math.min(acc.minY, scrap.y),
      maxY: Math.max(acc.maxY, scrap.y + scrapHeight),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  )

  bounds.minX = Math.min(bounds.minX, 0)
  bounds.minY = Math.min(bounds.minY, 0)
  bounds.maxX = Math.max(bounds.maxX, 0)
  bounds.maxY = Math.max(bounds.maxY, 0)

  return { 
    width: bounds.maxX - bounds.minX + (2 * padding), 
    height: bounds.maxY - bounds.minY + (2 * padding) 
  }
}

function getScrapPosition(scrap: any, allScraps: any[], padding: number) {
  const minX = Math.min(0, ...allScraps.map(s => s.x))
  const minY = Math.min(0, ...allScraps.map(s => s.y))
  
  return { 
    x: scrap.x - minX + padding, 
    y: scrap.y - minY + padding 
  }
}

function convertClickToCanvasCoordinates(clickX: number, clickY: number, allScraps: any[], padding: number) {
  const minX = allScraps.length > 0 ? Math.min(0, ...allScraps.map(s => s.x)) : 0
  const minY = allScraps.length > 0 ? Math.min(0, ...allScraps.map(s => s.y)) : 0
  
  const canvasX = clickX + minX - padding
  const canvasY = clickY + minY - padding
  
  return { 
    x: Math.max(0, Math.round(canvasX)), 
    y: Math.max(0, Math.round(canvasY)) 
  }
}