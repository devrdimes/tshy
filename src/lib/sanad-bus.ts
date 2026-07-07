// ============================================================
// Tashyeed — Sanad Event Bus
// Lightweight pub/sub for guide action detection
// ============================================================

type EventCallback = (payload?: unknown) => void

class SanadEventBus {
  private listeners = new Map<string, Set<EventCallback>>()

  emit(eventName: string, payload?: unknown) {
    this.listeners.get(eventName)?.forEach((cb) => cb(payload))
  }

  on(eventName: string, callback: EventCallback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }
    this.listeners.get(eventName)!.add(callback)
  }

  off(eventName: string, callback: EventCallback) {
    this.listeners.get(eventName)?.delete(callback)
  }
}

// Singleton — one bus for the whole app
export const sanadBus = new SanadEventBus()

// ── Typed event helpers ──────────────────────────────────────

/** Emit that a specific data-sanad-id was clicked */
export function emitSanadClick(targetId: string) {
  sanadBus.emit(`click:${targetId}`)
}

/** Emit that the user typed into a specific input */
export function emitSanadInput(targetId: string, value: string) {
  sanadBus.emit(`input:${targetId}`, value)
}

/** Emit a custom named event (e.g. task_created, step_completed) */
export function emitSanadEvent(eventName: string, payload?: unknown) {
  sanadBus.emit(eventName, payload)
}
