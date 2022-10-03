export {};

// Boilerplate schema for cordova API available on window object
interface Cordova {
  platformId?: string
  plugins?: Record<string, any>
  openwith?: any // cordova-plugin-openwith
}

declare global {
  interface Window {
    cordova?: Cordova
  }
}
