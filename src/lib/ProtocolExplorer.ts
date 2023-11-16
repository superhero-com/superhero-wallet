/**
 * Force required methods for handling generation of the protocol explorer URLs
 */
export abstract class ProtocolExplorer {
  abstract prepareUrlForAccount(address: string): string;

  abstract prepareUrlForHash(hash: string): string | undefined;
}
