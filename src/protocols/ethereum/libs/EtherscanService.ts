import { ref } from 'vue';
import { fromWei } from 'web3-utils';
import BigNumber from 'bignumber.js';

import type { AccountAddress, AssetContractId, ITransaction } from '@/types';
import type { EthRpcEtherscanProxyMethod } from '@/protocols/ethereum/types';
import { ETHERSCAN_API_KEY, PROTOCOLS, TXS_PER_PAGE } from '@/constants';
import { fetchJson, removeObjectUndefinedProperties, sleep } from '@/utils';
import { ETH_CONTRACT_ID, ETH_SAFE_CONFIRMATION_COUNT } from '../config';
import { toEthChecksumAddress } from '../helpers';

const NO_TRANSACTIONS_FOUND_MESSAGE = 'No transactions found';

export interface EtherscanDefaultResponse {
  status: '1' | '0';
  message: string; // 'OK' / 'OK-<WithExplanation>'
  result: any;
}

interface EtherscanApiCallParams {
  module: 'account' | 'contract' | 'transaction' | 'block' | 'logs' | 'proxy' | 'stats' | 'gastracker';
  action: 'txlist' | 'tokentx' | 'getabi' | EthRpcEtherscanProxyMethod; // Extend in the future
  [key: string]: string | undefined;
}

let lastCallTime: number;

export const isEtherscanUnavailable = ref(false);

/**
 * @see docs.etherscan.io
 */
export class EtherscanService {
  apiUrl: string;

  // TODO - update delay if we use paid API key
  freeVersionTimeDelay = 5300;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async fetchFromApi<T = EtherscanDefaultResponse>(obj: EtherscanApiCallParams): Promise<T | null> {
    const query = new URLSearchParams({
      ...removeObjectUndefinedProperties(obj),
      apikey: ETHERSCAN_API_KEY,
    }).toString();

    // With free API key we can make 5 calls per second.
    // We're adding delays between calls to avoid getting empty results.
    // TODO: Use own node or paid version
    const currTime = new Date().getTime();
    const timeToWait = (lastCallTime) ? this.freeVersionTimeDelay - (currTime - lastCallTime) : 0;
    lastCallTime = currTime + ((timeToWait > 0) ? timeToWait : 0);
    if (timeToWait > 0) {
      await sleep(timeToWait);
    }
    try {
      const response = await fetchJson<T>(`${this.apiUrl}?${query}`);
      isEtherscanUnavailable.value = false;
      return response;
    } catch (e) {
      isEtherscanUnavailable.value = true;
      throw e;
    }
  }

  /**
   * Fetch ETH Coin transactions (also contains fee payments for sending ERC-20 tokens).
   */
  async fetchAccountCoinTransactions(
    address: string,
    options: { page?: string; offset?: string },
  ): Promise<ITransaction[]> {
    const {
      page = '1',
      offset = TXS_PER_PAGE.toString(),
    } = options;

    const response = await this.fetchFromApi({
      module: 'account',
      action: 'txlist',
      address,
      page,
      offset,
      sort: 'desc',
    });

    if (response?.status !== '1' && response?.message !== NO_TRANSACTIONS_FOUND_MESSAGE) {
      throw new Error(response?.result || response?.message);
    }

    return response?.result?.map(
      (transaction: any) => EtherscanService.normalizeEtherscanTransactionStructure(
        transaction,
        address,
      ),
    ) || [];
  }

  /**
   * Fetch ERC-20 single token or all tokens transactions.
   */
  async fetchAccountTokenTransactions(
    address: string,
    options: {
      page?: string;
      offset?: string;
      /** Decides if returned transaction list will contain all ERC-20 tokens or one specified */
      assetContractId?: AssetContractId;
      startblock?: string;
      endblock?: string;
    } = {},
  ): Promise<ITransaction[]> {
    const {
      assetContractId,
      page = '1',
      offset = TXS_PER_PAGE.toString(),
      startblock,
      endblock,
    } = options;

    const response = await this.fetchFromApi({
      module: 'account',
      action: 'tokentx',
      contractaddress: assetContractId!,
      address,
      page,
      offset,
      sort: 'desc',
      startblock,
      endblock,
    });

    if (response?.status !== '1' && response?.message !== NO_TRANSACTIONS_FOUND_MESSAGE) {
      throw new Error(response?.result || response?.message);
    }

    return response?.result?.map(
      (transaction: any) => EtherscanService.normalizeEtherscanTransactionStructure(
        transaction,
        address,
        assetContractId,
      ),
    ) || [];
  }

  async fetchAccountTokenTransactionByHash(
    hash: string,
    address: string,
    blockNumber: string,
    input?: string,
  ): Promise<ITransaction | undefined> {
    // Not the best solution, but it seems to be the only way to get token transaction details
    const blockTransactions = await this.fetchAccountTokenTransactions(address, {
      startblock: blockNumber,
      endblock: blockNumber,
    });

    // The token transaction API doesn't always return input data, so we are adding it manually
    // if we have it from the previous call
    const transaction = blockTransactions.find((tx) => tx.hash === hash);
    if (
      transaction
      && input
      && (!transaction?.tx?.callData || (transaction?.tx?.callData as any) === 'deprecated')
    ) {
      transaction.tx.callData = input as any;
    }
    return transaction;
  }

  static normalizeEtherscanTransactionStructure(
    transaction: any,
    transactionOwner?: AccountAddress,
    assetContractId?: AssetContractId,
  ): ITransaction {
    const {
      confirmations,
      contractAddress,
      from,
      functionName,
      gasUsed,
      gasPrice,
      hash,
      nonce,
      timeStamp,
      to,
      value,
      input,
      tokenDecimal,
    } = transaction;

    const senderId = toEthChecksumAddress(from) as any;
    const recipientId = toEthChecksumAddress(to) as any;
    const transactionOwnerChecksumAddress = toEthChecksumAddress(transactionOwner!) as any;
    const contractId: any = (
      toEthChecksumAddress(contractAddress || assetContractId)
      || ETH_CONTRACT_ID
    );
    const gasPriceInEther = Number(fromWei(gasPrice, 'ether'));
    const fee = gasUsed * gasPriceInEther;
    const amount = tokenDecimal ? Number(new BigNumber(value).shiftedBy(-tokenDecimal)) : Number(fromWei(value, 'ether'));
    const pending = parseInt(confirmations, 10) <= ETH_SAFE_CONFIRMATION_COUNT;
    const microTime = timeStamp * 1000;
    const isEthTransfer = !contractAddress && (!input || input === '0x');

    return {
      protocol: PROTOCOLS.ethereum,
      transactionOwner: transactionOwnerChecksumAddress,
      hash,
      microTime,
      pending,
      tx: {
        amount,
        fee,
        senderId,
        recipientId,
        type: isEthTransfer ? 'SpendTx' : 'ContractCallTx', // TODO: create own types
        arguments: [],
        callerId: isEthTransfer ? '' as any : senderId,
        callData: isEthTransfer ? null : input,
        contractId,
        function: functionName,
        nonce,
        gasPrice: gasPriceInEther,
        gasUsed,
      },
    };
  }
}
