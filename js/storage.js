class StorageService {
  constructor() {
    this.storageKey = "lg_voice_assistant_settings"
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(settings))
      return true
    } catch (error) {
      console.error("Error saving settings:", error)
      return false
    }
  }

  loadSettings() {
    try {
      const settings = localStorage.getItem(this.storageKey)
      return settings ? JSON.parse(settings) : null
    } catch (error) {
      console.error("Error loading settings:", error)
      return null
    }
  }
}
