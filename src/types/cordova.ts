// Boilerplate schema for cordova API available on window object
export interface ICordova {
  platformId?: string
  plugins?: Record<string, any>
  InAppBrowser: any
}
