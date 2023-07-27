import {
  PROTOCOLS,
  DISTINCT_PROTOCOL_VIEWS,
} from '../popup/utils';

/**
 * Blockchain protocol slug name
 */
export type Protocol = typeof PROTOCOLS[number];

/**
 * List of views (pages and modals) that are required by all of the protocols.
 */
export type ProtocolView = typeof DISTINCT_PROTOCOL_VIEWS[number];

/**
 * List of protocol views with corresponding dynamic imports.
 */
export type ProtocolViewsConfig = Record<ProtocolView, () => Promise<any>>;