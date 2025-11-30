export type AudioCtxConstructor = new () => {
  resume?: () => Promise<void>
  createBuffer: (numOfChannels: number, length: number, sampleRate: number) => any
  createBufferSource: () => {
    buffer: any
    connect: (destination: any) => void
    start: (when?: number) => void
    stop: (when?: number) => void
  }
  destination?: unknown
}

export interface UserSettings {
  notifications: {
    push: boolean
    email: boolean
    chatNotifications: boolean
    safety: boolean
  }
  preferences: {
    language: string
    currency: string
    theme: string
    autoAcceptRides: boolean
    soundEnabled: boolean
  }
}

export const defaultSettings: UserSettings = {
  notifications: {
    push: true,
    email: true,
    chatNotifications: true,
    safety: true,
  },
  preferences: {
    language: "es",
    currency: "COP",
    theme: "light",
    autoAcceptRides: false,
    soundEnabled: true,
  },
}
