import { AensName, isAuctionName, Node } from '@aeternity/aepp-sdk';
import { isNotFoundError } from '@/utils';

export type NameRegistrationState = 'registered' | 'auction' | 'available';

export async function getNameRegistrationState(
  name: AensName,
  node: Pick<Node, 'getNameEntryByName' | 'getAuctionEntryByName'>,
): Promise<NameRegistrationState> {
  try {
    await node.getNameEntryByName(name);
    return 'registered';
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }

  if (isAuctionName(name)) {
    try {
      await node.getAuctionEntryByName(name);
      return 'auction';
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
    }
  }

  return 'available';
}
