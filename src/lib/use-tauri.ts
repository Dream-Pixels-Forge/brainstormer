'use client'

import { useState, useCallback } from 'react'

/**
 * Detect if running inside Tauri desktop runtime.
 * Uses lazy init instead of setState in effect to avoid lint violations.
 */
export function useIsTauri(): boolean {
  const [isTauri] = useState(() =>
    typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
  )
  return isTauri
}

/**
 * Synchronous Tauri detection (for use outside hooks)
 */
export function checkIsTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * Tauri window management helpers
 */
export function useTauriWindow() {
  const isTauri = useIsTauri()

  const hideWindow = useCallback(async () => {
    if (!isTauri) return
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().hide()
    } catch {
      // Not in Tauri or window API unavailable
    }
  }, [isTauri])

  const showWindow = useCallback(async () => {
    if (!isTauri) return
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().show()
      await getCurrentWindow().set_focus()
    } catch {
      // Not in Tauri
    }
  }, [isTauri])

  const setAlwaysOnTop = useCallback(async (onTop: boolean) => {
    if (!isTauri) return
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().set_always_on_top(onTop)
    } catch {
      // Not in Tauri
    }
  }, [isTauri])

  const toggleWindow = useCallback(async () => {
    if (!isTauri) return
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow()
      if (await win.is_visible()) {
        await win.hide()
      } else {
        await win.show()
        await win.set_focus()
      }
    } catch {
      // Not in Tauri
    }
  }, [isTauri])

  const saveFile = useCallback(async (content: string, filename: string): Promise<string | null> => {
    if (!isTauri) return null
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      return await invoke<string>('save_file', { content, filename })
    } catch {
      return null
    }
  }, [isTauri])

  return {
    isTauri,
    hideWindow,
    showWindow,
    setAlwaysOnTop,
    toggleWindow,
    saveFile,
  }
}
