document.addEventListener("DOMContentLoaded", () => {
  // Initialize services
  const storageService = new StorageService()
  const earthMascot = new EarthMascot("earth-mascot")
  const speechRecognition = new SpeechRecognitionService()
  const textToSpeech = new TextToSpeechService()
  const llmService = new LlmService()
  const lgService = new LgService()
  const qrScanner = new QrScanner()

  // DOM elements
  const voiceButton = document.querySelector(".voice-button")
  const settingsButton = document.querySelector(".settings-button")
  const settingsModal = document.querySelector(".settings-modal")
  const closeButton = document.querySelector(".close-button")
  const saveButton = document.querySelector(".save-button")
  const qrButton = document.querySelector(".qr-button")
  const qrScannerContainer = document.querySelector(".qr-scanner-container")
  const cancelScanButton = document.querySelector(".cancel-scan-button")
  const connectionStatus = document.querySelector(".connection-status")
  const statusDot = document.querySelector(".status-dot")
  const statusText = document.querySelector(".status-text")
  const transcriptContainer = document.querySelector(".transcript-container")
  const transcriptText = document.getElementById("transcript-text")
  const responseContainer = document.querySelector(".response-container")
  const responseText = document.getElementById("response-text")

  // Form inputs
  const ipAddressInput = document.getElementById("ip-address")
  const usernameInput = document.getElementById("username")
  const passwordInput = document.getElementById("password")
  const apiKeyInput = document.getElementById("api-key")

  // Load saved settings
  const loadSettings = () => {
    const settings = storageService.loadSettings()
    if (settings) {
      ipAddressInput.value = settings.ipAddress || ""
      usernameInput.value = settings.username || ""
      passwordInput.value = settings.password || ""
      apiKeyInput.value = settings.apiKey || ""

      // Set service values
      llmService.setApiKey(settings.apiKey)
      lgService.setConnectionDetails(settings.ipAddress, settings.username, settings.password)

      // Check connection
      checkLgConnection()
    }
  }

  // Check LG connection
  const checkLgConnection = async () => {
    try {
      const isConnected = await lgService.checkConnection()
      updateConnectionStatus(isConnected)

      if (!isConnected && lgService.ipAddress && lgService.username && lgService.password) {
        // Try to connect
        await lgService.connect()
        updateConnectionStatus(true)
      }
    } catch (error) {
      updateConnectionStatus(false)
    }
  }

  // Update connection status UI
  const updateConnectionStatus = (isConnected) => {
    if (isConnected) {
      statusDot.classList.remove("disconnected")
      statusDot.classList.add("connected")
      statusText.textContent = "Connected"
    } else {
      statusDot.classList.remove("connected")
      statusDot.classList.add("disconnected")
      statusText.textContent = "Disconnected"
    }
  }

  // Voice button click handler
  voiceButton.addEventListener("click", () => {
    if (speechRecognition.isListening) {
      speechRecognition.stop()
    } else {
      startListening()
    }
  })

  // Start listening
  const startListening = () => {
    // Clear previous results
    transcriptText.textContent = ""
    responseText.textContent = ""
    transcriptContainer.classList.add("hidden")
    responseContainer.classList.add("hidden")

    // Start recognition
    speechRecognition.start()
  }

  // Speech recognition events
  speechRecognition.onStartListening = () => {
    voiceButton.classList.add("listening")
    earthMascot.setListening(true)
  }

  speechRecognition.onStopListening = async (transcript) => {
    voiceButton.classList.remove("listening")
    earthMascot.setListening(false)

    if (transcript) {
      // Show transcript
      transcriptText.textContent = transcript
      transcriptContainer.classList.remove("hidden")

      // Process with LLM
      try {
        const response = await llmService.getResponse(transcript)

        // Show response
        responseText.textContent = response
        responseContainer.classList.remove("hidden")

        // Speak response
        textToSpeech.speak(response)

        // Send to Liquid Galaxy if connected
        if (lgService.isConnected) {
          lgService.sendToLiquidGalaxy(response).catch((error) => console.error("Error sending to LG:", error))
        }
      } catch (error) {
        console.error("Error processing speech:", error)
        responseText.textContent = `Error: ${error.message}`
        responseContainer.classList.remove("hidden")
      }
    }
  }

  speechRecognition.onResult = (transcript, isFinal) => {
    transcriptText.textContent = transcript
    transcriptContainer.classList.remove("hidden")
  }

  speechRecognition.onError = (error) => {
    console.error("Speech recognition error:", error)
    voiceButton.classList.remove("listening")
    earthMascot.setListening(false)
  }

  // Settings modal
  settingsButton.addEventListener("click", () => {
    settingsModal.classList.remove("hidden")
  })

  closeButton.addEventListener("click", () => {
    settingsModal.classList.add("hidden")
  })

  // Save settings
  saveButton.addEventListener("click", async () => {
    const settings = {
      ipAddress: ipAddressInput.value,
      username: usernameInput.value,
      password: passwordInput.value,
      apiKey: apiKeyInput.value,
    }

    // Save to storage
    storageService.saveSettings(settings)

    // Update services
    llmService.setApiKey(settings.apiKey)
    lgService.setConnectionDetails(settings.ipAddress, settings.username, settings.password)

    // Try to connect to LG
    try {
      await lgService.connect()
      updateConnectionStatus(true)
    } catch (error) {
      updateConnectionStatus(false)
    }

    // Close modal
    settingsModal.classList.add("hidden")
  })

  // QR scanner
  qrButton.addEventListener("click", async () => {
    qrScannerContainer.classList.remove("hidden")

    // Set up callback
    qrScanner.onScanComplete = (data) => {
      qrScannerContainer.classList.add("hidden")

      // Parse QR data
      try {
        const params = new URLSearchParams(data)
        ipAddressInput.value = params.get("ip") || ""
        usernameInput.value = params.get("username") || ""
        passwordInput.value = params.get("password") || ""
      } catch (error) {
        console.error("Error parsing QR data:", error)
        alert("Invalid QR code format")
      }
    }

    // Start scanner
    const started = await qrScanner.start()
    if (!started) {
      qrScannerContainer.classList.add("hidden")
      alert("Could not access camera. Please check permissions.")
    }
  })

  cancelScanButton.addEventListener("click", () => {
    qrScanner.stop()
    qrScannerContainer.classList.add("hidden")
  })

  // Initialize
  loadSettings()
})
