import BigNumber from 'bignumber.js';
import { Web3Eth } from 'web3-eth';

import { getTokenBalance } from '../helpers';

interface IUnconfirmedTokenTransfer {
  nodeUrl: string;
  from: string;
  contractId: string;
  nonce: number;
  /** In the token's units, as signed */
  amount: string;
}

/** Token sends of this session that the node may not have mined yet */
let unconfirmedTransfers: IUnconfirmedTokenTransfer[] = [];

const isSameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * Token balance that EVM sends can spend.
 */
export function useEthTokenBalance() {
  function addUnconfirmedTokenTransfer(transfer: IUnconfirmedTokenTransfer) {
    // Replaces a send the node dropped, of any token, as only one send per nonce gets mined
    unconfirmedTransfers = unconfirmedTransfers.filter((other) => (
      other.nonce !== transfer.nonce
      || other.nodeUrl !== transfer.nodeUrl
      || !isSameAddress(other.from, transfer.from)
    ));
    unconfirmedTransfers.push(transfer);
  }

  /**
   * The node's token balance without this wallet's sends it hasn't mined yet. Otherwise
   * a send after them passes the gas estimate and reverts on chain.
   */
  async function getSpendableTokenBalance(
    contractId: string,
    owner: string,
    nodeUrl: string,
  ): Promise<BigNumber> {
    const isOwnTransfer = (transfer: IUnconfirmedTokenTransfer) => (
      transfer.nodeUrl === nodeUrl
      && isSameAddress(transfer.from, owner)
      && isSameAddress(transfer.contractId, contractId)
    );
    if (!unconfirmedTransfers.some(isOwnTransfer)) {
      return getTokenBalance(contractId, owner, nodeUrl);
    }

    const web3Eth = new Web3Eth(nodeUrl);
    // One block for both, as a send can get mined between reads or load-balanced nodes differ
    const block = await web3Eth.getBlockNumber();
    const [minedCount, nextNonce, balance] = await Promise.all([
      web3Eth.getTransactionCount(owner, block).then(Number),
      web3Eth.getTransactionCount(owner, 'pending').then(Number),
      getTokenBalance(contractId, owner, nodeUrl, block),
    ]);
    unconfirmedTransfers = unconfirmedTransfers.filter(
      (transfer) => !isOwnTransfer(transfer) || transfer.nonce >= minedCount,
    );
    // A send at or above the node's next nonce was dropped
    const unconfirmedAmount = unconfirmedTransfers
      .filter((transfer) => isOwnTransfer(transfer) && transfer.nonce < nextNonce)
      .reduce((total, { amount }) => total.plus(amount), new BigNumber(0));
    return BigNumber.max(balance.minus(unconfirmedAmount), 0);
  }

  return {
    addUnconfirmedTokenTransfer,
    getSpendableTokenBalance,
  };
}
