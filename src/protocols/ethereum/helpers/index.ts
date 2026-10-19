import { fromWei, toChecksumAddress, toWei } from 'web3-utils';
import { FMT_BYTES, FMT_NUMBER, type ContractAbi } from 'web3-types';
import { getBlock, getTransaction, getTransactionReceipt } from 'web3-eth';
import { bigIntToHex } from 'web3-eth-accounts';
import Contract from 'web3-eth-contract';
import BigNumber from 'bignumber.js';

import {
  AccountAddress,
  Dictionary,
  ITransaction,
  Protocol,
} from '@/types';
import { handleUnknownError } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { TX_RETURN_TYPE_REVERT } from '@/protocols/aeternity/config';
import { toTokenBaseUnits, withGasHeadroom } from '@/protocols/evm/helpers';
import { getActiveEvmNetworkSettings } from '@/protocols/evm/helpers/activeEvmNetworkSettings';
import { ERC20_ABI } from '../config';
import { EthDecodedCallData } from '../types';
import { EtherscanService } from '../libs/EtherscanService';

/** `transfer` and `approve`, decoded with `ERC20_ABI` */
const ERC20_METHOD_SIGNATURES = ['0xa9059cbb', '0x095ea7b3'];

/**
 * Convert Gwei to Ether
 */
export function etherFromGwei(gwei: number) {
  return new BigNumber(fromWei(toWei(gwei, 'gwei'), 'ether'));
}

export function normalizeWeb3EthTransactionStructure(
  protocol: Protocol,
  transaction?: Awaited<ReturnType<typeof getTransaction>> & { gasPrice?: string },
  block?: Awaited<ReturnType<typeof getBlock>>,
  transactionOwner?: AccountAddress,
  receipt?: Awaited<ReturnType<typeof getTransactionReceipt>>,
): ITransaction {
  const {
    blockNumber,
    from,
    hash,
    gas,
    gasPrice,
    to,
    value,
    input,
  } = transaction || {};
  const { timestamp } = block || {};
  const transactionOwnerChecksumAddress: any = toChecksumAddress(transactionOwner!);
  const isContractCall = !!input && input !== '0x';
  const contractId = isContractCall && to
    ? toChecksumAddress(to)
    : ProtocolAdapterFactory.getAdapter(protocol).coinContractId;
  // The fee paid once mined, the most it can cost before
  const feeInWei = receipt
    ? BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice ?? gasPrice ?? 0)
    : BigInt(gas ?? 0) * BigInt(gasPrice ?? 0);
  const isReverted = receipt?.status !== undefined && Number(receipt.status) === 0;

  return {
    transactionOwner: transactionOwnerChecksumAddress,
    protocol,
    hash: hash as any,
    microTime: timestamp ? new Date(Number(timestamp) * 1000).getTime() : undefined,
    pending: !blockNumber, // if blockNumber is falsy, transaction is pending
    blockHeight: Number(blockNumber),
    tx: {
      amount: Number(fromWei(value || 0, 'ether')),
      fee: Number(fromWei(feeInWei, 'ether')),
      senderId: from ? toChecksumAddress(from) : undefined,
      recipientId: to ? toChecksumAddress(to) : undefined,
      type: isContractCall ? 'ContractCallTx' : 'SpendTx', // TODO: create own types
      tag: (isContractCall ? 'ContractCallTx' : 'SpendTx') as any, // TODO: create own types
      arguments: [],
      callerId: '',
      contractId,
      returnType: isReverted ? TX_RETURN_TYPE_REVERT : undefined,
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

  const tokenDecimals = Number(await contract.methods.decimals().call());
  const hexAmount = bigIntToHex(toTokenBaseUnits(amount, tokenDecimals));

  const gasEstimation = await contract.methods.transfer(recipient, hexAmount)
    .estimateGas(undefined, { number: FMT_NUMBER.NUMBER, bytes: FMT_BYTES.HEX });
  // Same headroom the adapters apply - this is the fee the form validates against.
  const gasWithHeadroom = Number(withGasHeadroom(gasEstimation));
  const roundedToNextThousand = Math.ceil(gasWithHeadroom / 1000) * 1000;
  return roundedToNextThousand;
}

async function fetchContractAbi(contractId: string, protocol: Protocol) {
  const { middlewareUrl, chainId } = getActiveEvmNetworkSettings(protocol);
  const contractAbi = await new EtherscanService(middlewareUrl, chainId)
    .fetchFromApi({
      module: 'contract',
      action: 'getabi',
      address: contractId,
    });

  return contractAbi?.message?.startsWith('OK')
    ? JSON.parse(contractAbi.result) as ContractAbi
    : undefined;
}

export async function decodeTxData(
  txData: string,
  contractId: string,
  fromAccount: string,
  protocol: Protocol,
): Promise<EthDecodedCallData | undefined> {
  // web3 looks up the selector in lowercase
  const data = txData.toLowerCase();
  const abi = ERC20_METHOD_SIGNATURES.includes(data.slice(0, 10))
    ? ERC20_ABI
    : await fetchContractAbi(contractId, protocol);

  if (!abi) {
    return undefined;
  }

  const contractInstance = new Contract(
    abi,
    contractId,
    { from: fromAccount },
  );

  try {
    // Decode the method and parameters from the input data
    // TODO contractInstance doesn't always have the method signatures
    // then we are not able to decode the method name and get the parameters
    const methodSignature = data.slice(0, 10);
    const method = contractInstance.options.jsonInterface
      .find((m) => m.signature === methodSignature);

    const params = contractInstance.decodeMethodData(data);

    return {
      functionName: (method as any).name,
      args: params as Dictionary,
    };
  } catch (e) {
    handleUnknownError(e);
  }
  return undefined;
}
