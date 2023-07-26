/**
 *  Represents common attributes and behavior of a protocol
 */
export abstract class BaseProtocolAdapter {
  abstract getBalance(address: string): Promise<string>;
}
