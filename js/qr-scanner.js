import jsQR from "jsqr"

class QrScanner {
  constructor() {
    this.video = document.getElementById("qr-video")
    this.canvasElement = document.createElement("canvas")
    this.canvas = this.canvasElement.getContext("2d")
    this.scanning = false
    this.onScanComplete = null
  }

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      this.video.srcObject = stream
      this.video.setAttribute("playsinline", true)
      this.video.play()

      this.scanning = true
      requestAnimationFrame(() => this.tick())

      return true
    } catch (error) {
      console.error("Error starting QR scanner:", error)
      return false
    }
  }

  stop() {
    this.scanning = false

    if (this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks()
      tracks.forEach((track) => track.stop())
      this.video.srcObject = null
    }
  }

  tick() {
    if (!this.scanning) return

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.canvasElement.height = this.video.videoHeight
      this.canvasElement.width = this.video.videoWidth

      this.canvas.drawImage(this.video, 0, 0, this.canvasElement.width, this.canvasElement.height)

      const imageData = this.canvas.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height)

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      })

      if (code) {
        console.log("QR code found:", code.data)

        // Call the callback with the scanned data
        if (this.onScanComplete) {
          this.onScanComplete(code.data)
        }

        // Stop scanning
        this.stop()
        return
      }
    }

    // Continue scanning
    requestAnimationFrame(() => this.tick())
  }
}
