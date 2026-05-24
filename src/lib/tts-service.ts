/**
 * Browser-based Text-to-Speech service.
 * Wraps the Web Speech API (SpeechSynthesis) with a Promise-based interface.
 */

class TTSService {
  private synthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
    }
  }

  /** Check if TTS is available in this browser */
  isAvailable(): boolean {
    return this.synthesis !== null
  }

  /** Speak the given text. Returns a Promise that resolves when speech ends. */
  speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not available'))
        return
      }

      // Cancel any ongoing speech
      this.stop()

      // Clean the text — strip markdown-like characters for natural speech
      const cleanText = text
        .replace(/#{1,6}\s/g, '')       // headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // bold
        .replace(/\*(.*?)\*/g, '$1')     // italic
        .replace(/`(.*?)`/g, '$1')       // inline code
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
        .replace(/[-*+]\s/g, '')         // list markers
        .replace(/\d+\.\s/g, '')         // numbered lists
        .trim()

      if (!cleanText) {
        resolve()
        return
      }

      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      // Try to pick a good English voice
      const voices = this.synthesis.getVoices()
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural'))
      )
      if (preferred) {
        utterance.voice = preferred
      }

      utterance.onend = () => {
        this.currentUtterance = null
        resolve()
      }

      utterance.onerror = (event) => {
        this.currentUtterance = null
        // Don't reject on 'canceled' — it's intentional when stop() is called
        if (event.error === 'canceled' || event.error === 'interrupted') {
          resolve()
        } else {
          reject(new Error(`Speech error: ${event.error}`))
        }
      }

      this.currentUtterance = utterance
      this.synthesis.speak(utterance)
    })
  }

  /** Stop any currently playing speech */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
    this.currentUtterance = null
  }

  /** Check if speech is currently in progress */
  isSpeaking(): boolean {
    if (!this.synthesis) return false
    return this.synthesis.speaking
  }
}

// Singleton instance
export const ttsService = new TTSService()
