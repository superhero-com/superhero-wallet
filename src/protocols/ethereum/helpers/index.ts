import { fromWei, toChecksumAddress, toWei } from 'web3-utils';
import { FMT_BYTES, FMT_NUMBER } from 'web3-types';
import { getBlock, getTransaction } from 'web3-eth';
import { bigIntToHex } from 'web3-eth-accounts';
import Contract from 'web3-eth-contract';
import BigNumber from 'bignumber.js';

import { AccountAddress, Dictionary, ITransaction } from '@/types';
import { PROTOCOLS } from '@/constants';
import { handleUnknownError } from '@/utils';
import { ERC20_ABI, ETH_CONTRACT_ID } from '../config';
import { EthDecodedCallData } from '../types';
import { EtherscanService } from '../libs/EtherscanService';
import { useEthNetworkSettings } from '../composables/ethNetworkSettings';

/**
 * Convert Gwei to Ether
 */
export function etherFromGwei(gwei: number) {
  return new BigNumber(fromWei(toWei(gwei, 'gwei'), 'ether'));
}

export function normalizeWeb3EthTransactionStructure(
  transaction?: Awaited<ReturnType<typeof getTransaction>> & { gasPrice?: string },
  block?: Awaited<ReturnType<typeof getBlock>>,
  transactionOwner?: AccountAddress,
): ITransaction {
  const {
    blockNumber,
    from,
    hash,
    gas,
    gasPrice,
    to,
    value,
    type,
    input,
  } = transaction || {};
  const { timestamp } = block || {};
  const isLegacy = (Number(type) === 0); // e.g.: faucet
  const transactionOwnerChecksumAddress: any = toChecksumAddress(transactionOwner!);
  const isEthTransfer = input !== '0x';
  const contractId = isEthTransfer && to ? toChecksumAddress(to) : ETH_CONTRACT_ID;

  return {
    transactionOwner: transactionOwnerChecksumAddress,
    protocol: PROTOCOLS.ethereum,
    hash: hash as any,
    microTime: timestamp ? new Date(Number(timestamp) * 1000).getTime() : undefined,
    pending: !blockNumber, // if blockNumber is falsy, transaction is pending
    blockHeight: Number(blockNumber),
    tx: {
      amount: Number(fromWei(value || 0, 'ether')),
      fee: (!isLegacy) ? +fromWei(Number(gas || 0) * Number(gasPrice || 0), 'ether') : 0,
      senderId: from ? toChecksumAddress(from) : undefined,
      recipientId: to ? toChecksumAddress(to) : undefined,
      type: isEthTransfer ? 'SpendTx' : 'ContractCallTx', // TODO: create own types
      tag: (isEthTransfer ? 'SpendTx' : 'ContractCallTx') as any, // TODO: create own types
      arguments: [],
      callerId: '',
      contractId,
    },
  };
}

/**
 * Convert address to checksum address if is prefixed with 0x
 * to avoid errors in cases like contractId="ethereum"
 */
export function toEthChecksumAddress(address: string) {
  if (!address) return address;
  return (address?.startsWith('0x')) ? toChecksumAddress(address) : address;
}

/**
 * Estimate gas limit for ERC20 token transfer
 * using the ERC20 ABI because fetching the contract ABI
 * takes way too long and is not necessary for this operation
 * TODO - use fetched contract ABI when we have our own node/middleware
 */
export async function getTokenTransferGasLimit(
  contractId: string,
  recipient: string,
  fromAccount: string,
  amount: BigNumber,
  nodeUrl: string,
) {
  const contract = new Contract(
    ERC20_ABI,
    contractId,
    { from: fromAccount },
  );
  contract.setProvider(nodeUrl);

  const hexAmount = bigIntToHex(BigInt(toWei(amount.toFixed(
    Number(await contract.methods.decimals().call()),
  ), 'ether')));

  const gasEstimation = await contract.methods.transfer(recipient, hexAmount)
    .estimateGas(undefined, { number: FMT_NUMBER.NUMBER, bytes: FMT_BYTES.HEX });
  const roundedToNextThousand = Math.ceil(Number(gasEstimation / 1000)) * 1000;
  return roundedToNextThousand;
}

export async function decodeTxData(
  txData: string,
  contractId: string,
  fromAccount: string,
): Promise<EthDecodedCallData | undefined> {
  const {
    ethActiveNetworkPredefinedSettings,
    ethActiveNetworkSettings,
  } = useEthNetworkSettings();
  const { middlewareUrl: apiUrl } = ethActiveNetworkPredefinedSettings.value;
  const { chainId } = ethActiveNetworkSettings.value;

  const contractAbi = await new EtherscanService(apiUrl, chainId)
    .fetchFromApi({
      module: 'contract',
      action: 'getabi',
      address: contractId,
    });

  if (!contractAbi?.message?.startsWith('OK')) {
    return undefined;
  }
  const parsedAbi = JSON.parse(contractAbi.result);

  const contractInstance = new Contract(
    parsedAbi,
    contractId,
    { from: fromAccount },
  );

  try {
    // Decode the method and parameters from the input data
    // TODO contractInstance doesn't always have the method signatures
    // then we are not able to decode the method name and get the parameters
    const methodSignature = txData.slice(0, 10);
    const method = contractInstance.options.jsonInterface
      .find((m) => m.signature === methodSignature);

    const params = contractInstance.decodeMethodData(txData);

    return {
      functionName: (method as any).name,
      args: params as Dictionary,
    };
  } catch (e) {
    handleUnknownError(e);
  }
  return undefined;
}
