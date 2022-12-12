import Vue, { ComponentOptions } from 'vue';
import { RawLocation, RouteConfig } from 'vue-router';

export interface WalletRouteMeta {
  /**
   * Decide if the page should be displayed in a similar way to modal.
   * Applies mostly to the page transition animation.
   */
  asModal?: boolean
  /**
   * Explicitly define the route that the user will be taken to after clicking
   * the app header back arrow.
   * TODO: Temporary solution.
   */
  backRoute?: RawLocation
  /**
   * Decide if the app header should be hidden
   */
  hideHeader?: boolean
  /**
   * Decide if the app header notification icon should be hidden
   */
  hideNotificationsIcon?: boolean
  /**
   * Allow to see the page by unauthorized users
   */
  ifNotAuth?: boolean
  /**
   * Only for unauthorized users
   */
  ifNotAuthOnly?: boolean
  isAeCoinDetails?: boolean
  /**
   * Decide if the page allows to edit the displayed data
   */
  isEdit?: boolean
  /**
   * Display the app header as a modal header
   * @default: false
   */
  isModalHeader?: boolean
  /**
   * Decide of the route should be saved to browser's local storage
   */
  notPersist?: boolean
  /**
   * Part of the translation string that point to the translated page title
   * 'pages.title[title]`
   */
  title?: string
  /**
   * Decide if the header back button should be visible
   */
  showBackButton?: boolean
  /**
   * Decide if the header close button should be visible
   */
  showCloseButton?: boolean
  /**
   * Decide if the scrollbar should be visible to the user
   * @default: false
   */
  showScrollbar?: boolean
}

export type WalletAppRouteConfig = Omit<RouteConfig, 'meta'> & {
  meta?: WalletRouteMeta
  component?: typeof Vue | ComponentOptions<Vue>,
  children?: WalletAppRouteConfig[],
}
