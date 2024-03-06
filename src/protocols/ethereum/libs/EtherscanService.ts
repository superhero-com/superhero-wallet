import { fromWei } from 'web3-utils';
import type { AccountAddress, AssetContractId, ITransaction } from '@/types';
import { ETHERSCAN_API_KEY, PROTOCOLS, TXS_PER_PAGE } from '@/constants';
import { fetchJson, removeObjectUndefinedProperties, sleep } from '@/utils';
import { ETH_CONTRACT_ID, ETH_SAFE_CONFIRMATION_COUNT } from '../config';
import { toEthChecksumAddress } from '../helpers';

const NO_TRANSACTIONS_FOUND_MESSAGE = 'No transactions found';

interface EtherscanDefaultResponse {
  status: '1' | '0';
  message: string; // 'OK' / 'OK-<WithExplanation>'
  result: any;
}

interface EtherscanApiCallParams {
  module: 'account' | 'contract' | 'transaction' | 'block' | 'logs' | 'proxy' | 'stats' | 'gastracker';
  action: 'txlist' | 'tokentx' | 'getabi'; // Extend in the future
  [key: string]: string | undefined;
}

let lastCallTime: number;

/**
 * @see docs.etherscan.io
 */
export class EtherscanService {
  apiUrl: string;

  freeVersionTimeDelay = 5300;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async fetchFromApi<T = EtherscanDefaultResponse>(obj: EtherscanApiCallParams): Promise<T | null> {
    const query = new URLSearchParams({
      ...removeObjectUndefinedProperties(obj),
      apikey: ETHERSCAN_API_KEY,
    }).toString();

    // Without API key amount of calls are limited to one per every 5 seconds.
    // We're adding delays between calls to avoid getting empty results.
    // TODO: Use own node or paid version
    if (!ETHERSCAN_API_KEY) {
      const currTime = new Date().getTime();
      const timeToWait = (lastCallTime) ? this.freeVersionTimeDelay - (currTime - lastCallTime) : 0;
      lastCallTime = currTime + ((timeToWait > 0) ? timeToWait : 0);
      if (timeToWait > 0) {
        await sleep(timeToWait);
      }
    }

    return fetchJson<T>(`${this.apiUrl}?${query}`);
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
  ): Promise<ITransaction> {
    // Not the best solution, but it seems to be the only way to get token transaction details
    const blockTransactions = await this.fetchAccountTokenTransactions(address, {
      startblock: blockNumber,
      endblock: blockNumber,
    });
    return blockTransactions.find((tx) => tx.hash === hash) as ITransaction;
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
    const amount = Number(fromWei(value, 'ether'));
    const pending = parseInt(confirmations, 10) <= ETH_SAFE_CONFIRMATION_COUNT;
    const microTime = timeStamp * 1000;
    const isEthTransfer = !contractAddress;

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
        contractId,
        function: functionName,
        nonce,
        gasPrice: gasPriceInEther,
        gasUsed,
      },
    };
  }
}
