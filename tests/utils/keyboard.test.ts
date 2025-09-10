/**
 * Unit tests for keyboard interaction utilities
 */

describe('Keyboard Utilities', () => {
  describe('handleKeyboardShortcuts', () => {
    let mockEvent: KeyboardEvent

    beforeEach(() => {
      mockEvent = {
        key: '',
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as KeyboardEvent
    })

    it('should detect Escape key', () => {
      mockEvent.key = 'Escape'
      
      const result = isEscapeKey(mockEvent)
      
      expect(result).toBe(true)
    })

    it('should detect Cmd+Enter on Mac', () => {
      mockEvent.key = 'Enter'
      mockEvent.metaKey = true
      
      const result = isSubmitShortcut(mockEvent)
      
      expect(result).toBe(true)
    })

    it('should detect Ctrl+Enter on Windows/Linux', () => {
      mockEvent.key = 'Enter'
      mockEvent.ctrlKey = true
      
      const result = isSubmitShortcut(mockEvent)
      
      expect(result).toBe(true)
    })

    it('should not detect submit without modifier keys', () => {
      mockEvent.key = 'Enter'
      
      const result = isSubmitShortcut(mockEvent)
      
      expect(result).toBe(false)
    })

    it('should detect shift key press', () => {
      mockEvent.shiftKey = true
      
      const result = isShiftPressed(mockEvent)
      
      expect(result).toBe(true)
    })

    it('should not detect shift when other keys pressed', () => {
      mockEvent.shiftKey = false
      
      const result = isShiftPressed(mockEvent)
      
      expect(result).toBe(false)
    })
  })

  describe('Modal Keyboard Management', () => {
    let mockCallbacks: {
      onEscape: jest.Mock
      onSubmit: jest.Mock
    }

    beforeEach(() => {
      mockCallbacks = {
        onEscape: jest.fn(),
        onSubmit: jest.fn(),
      }
    })

    it('should call escape callback when escape pressed', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      
      handleModalKeyboard(event, mockCallbacks)
      
      expect(mockCallbacks.onEscape).toHaveBeenCalled()
      expect(mockCallbacks.onSubmit).not.toHaveBeenCalled()
    })

    it('should call submit callback when Cmd+Enter pressed', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', metaKey: true })
      
      handleModalKeyboard(event, mockCallbacks)
      
      expect(mockCallbacks.onSubmit).toHaveBeenCalled()
      expect(mockCallbacks.onEscape).not.toHaveBeenCalled()
    })

    it('should prevent default for handled shortcuts', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', metaKey: true })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
      
      handleModalKeyboard(event, mockCallbacks)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should not handle unrecognized keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' })
      
      handleModalKeyboard(event, mockCallbacks)
      
      expect(mockCallbacks.onEscape).not.toHaveBeenCalled()
      expect(mockCallbacks.onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Shift State Management', () => {
    let shiftState: { isPressed: boolean }

    beforeEach(() => {
      shiftState = { isPressed: false }
    })

    it('should set shift state on keydown', () => {
      const event = new KeyboardEvent('keydown', { shiftKey: true })
      
      updateShiftState(event, shiftState, 'down')
      
      expect(shiftState.isPressed).toBe(true)
    })

    it('should unset shift state on keyup', () => {
      shiftState.isPressed = true
      const event = new KeyboardEvent('keyup', { shiftKey: false })
      
      updateShiftState(event, shiftState, 'up')
      
      expect(shiftState.isPressed).toBe(false)
    })

    it('should handle shift state during modal operations', () => {
      shiftState.isPressed = true
      
      resetShiftState(shiftState)
      
      expect(shiftState.isPressed).toBe(false)
    })

    it('should ignore shift changes when modals are open', () => {
      const event = new KeyboardEvent('keydown', { shiftKey: true })
      const isModalOpen = true
      
      const shouldUpdate = shouldUpdateShiftState(isModalOpen, false)
      
      expect(shouldUpdate).toBe(false)
    })

    it('should allow shift changes when no modals are open', () => {
      const event = new KeyboardEvent('keydown', { shiftKey: true })
      const isModalOpen = false
      
      const shouldUpdate = shouldUpdateShiftState(isModalOpen, false)
      
      expect(shouldUpdate).toBe(true)
    })

    it('should ignore shift changes during move mode', () => {
      const isModalOpen = false
      const isMoveMode = true
      
      const shouldUpdate = shouldUpdateShiftState(isModalOpen, isMoveMode)
      
      expect(shouldUpdate).toBe(false)
    })
  })
})

// Mock implementation functions
function isEscapeKey(event: KeyboardEvent): boolean {
  return event.key === 'Escape'
}

function isSubmitShortcut(event: KeyboardEvent): boolean {
  return event.key === 'Enter' && (event.metaKey || event.ctrlKey)
}

function isShiftPressed(event: KeyboardEvent): boolean {
  return event.shiftKey
}

function handleModalKeyboard(event: KeyboardEvent, callbacks: { onEscape: () => void; onSubmit: () => void }) {
  if (isEscapeKey(event)) {
    callbacks.onEscape()
  } else if (isSubmitShortcut(event)) {
    event.preventDefault()
    callbacks.onSubmit()
  }
}

function updateShiftState(event: KeyboardEvent, state: { isPressed: boolean }, type: 'up' | 'down') {
  if (type === 'down' && event.shiftKey && !state.isPressed) {
    state.isPressed = true
  } else if (type === 'up' && !event.shiftKey) {
    state.isPressed = false
  }
}

function resetShiftState(state: { isPressed: boolean }) {
  state.isPressed = false
}

function shouldUpdateShiftState(isModalOpen: boolean, isMoveMode: boolean): boolean {
  return !isModalOpen && !isMoveMode
}