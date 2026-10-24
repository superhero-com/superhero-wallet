import Web3Eth from 'web3-eth';
import { Common, Transaction } from 'web3-eth-accounts';
import { bytesToHex, numberToHex, toChecksumAddress } from 'web3-utils';

import type { ITransferResponse, Protocol } from '@/types';
import { useAccounts } from '@/composables';
import { broadcastSignedTransaction } from './broadcastSignedTransaction';

/**
 * Sign a transaction prepared by a dapp with the account it names as `from`
 * and broadcast it, at the gas price the user was shown.
 */
export async function transferPreparedLegacyTransaction(
  protocol: Protocol,
  { chainId, nodeUrl }: { chainId: string; nodeUrl: string },
  {
    from,
    to,
    value,
    data = '0x',
    gas,
    gasPrice,
  }: any,
): Promise<ITransferResponse> {
  const { getAccountByProtocolAndAddress } = useAccounts();
  const account = getAccountByProtocolAndAddress(protocol, toChecksumAddress(from));
  if (!account) {
    throw new Error(`Transaction was initiated from non-existing or non-${protocol} account.`);
  }

  const web3Eth = new Web3Eth(nodeUrl);
  const nonce = await web3Eth.getTransactionCount(from, 'pending');
  const common = Common.custom({ chainId: Number(chainId), networkId: Number(chainId) });
  const signedTx = new Transaction({
    nonce,
    gasPrice,
    gasLimit: numberToHex(gas),
    to,
    value,
    data,
  }, { common }).sign(account.secretKey!);

  await broadcastSignedTransaction(web3Eth, signedTx.serialize());
  return { hash: bytesToHex(signedTx.hash()) };
}
