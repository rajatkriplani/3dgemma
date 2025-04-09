class SpeechRecognitionService {
  constructor() {
    this.recognition = null
    this.isListening = false
    this.transcript = ""
    this.onStartListening = null
    this.onStopListening = null
    this.onResult = null
    this.onError = null

    this.initRecognition()
  }

  initRecognition() {
    // Check browser support
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.error("Speech recognition not supported in this browser")
      return
    }

    // Create speech recognition instance
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()

    // Configure
    this.recognition.continuous = false
    this.recognition.interimResults = true
    this.recognition.lang = "en-US"

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true
      if (this.onStartListening) this.onStartListening()
    }

    this.recognition.onend = () => {
      this.isListening = false
      if (this.onStopListening) this.onStopListening(this.transcript)
    }

    this.recognition.onresult = (event) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      this.transcript = finalTranscript || interimTranscript

      if (this.onResult) this.onResult(this.transcript, finalTranscript !== "")
    }

    this.recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      if (this.onError) this.onError(event.error)
    }
  }

  start() {
    if (!this.recognition) {
      console.error("Speech recognition not initialized")
      return
    }

    if (!this.isListening) {
      this.transcript = ""
      this.recognition.start()
    }
  }

  stop() {
    if (!this.recognition) {
      console.error("Speech recognition not initialized")
      return
    }

    if (this.isListening) {
      this.recognition.stop()
    }
  }
}

class TextToSpeechService {
  constructor() {
    this.synthesis = window.speechSynthesis
    this.voice = null

    this.initVoices()
  }

  initVoices() {
    // Get available voices
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.setVoice()
    }

    this.setVoice()
  }

  setVoice() {
    const voices = this.synthesis.getVoices()

    // Try to find an English voice
    this.voice =
      voices.find((voice) => voice.lang.includes("en-US")) ||
      voices.find((voice) => voice.lang.includes("en")) ||
      voices[0]
  }

  speak(text) {
    if (!this.synthesis) {
      console.error("Speech synthesis not supported")
      return
    }

    // Cancel any ongoing speech
    this.synthesis.cancel()

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text)

    // Set voice
    if (this.voice) {
      utterance.voice = this.voice
    }

    // Set properties
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1

    // Speak
    this.synthesis.speak(utterance)
  }
}
