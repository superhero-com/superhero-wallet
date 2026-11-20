import { decodeParameters } from 'web3-eth-abi';
import { bytesToHex, toChecksumAddress } from 'web3-utils';

import type { IEvmCall, Protocol } from '@/types';
import { PROTOCOLS } from '@/constants';
import { PERMIT2_ADDRESS } from '@/protocols/evm/helpers/decodeEvmCallIntent';
import { evmNodeRequest } from '@/protocols/evm/helpers/evmNodeRequest';

/** Of the user, in base units; `asset` is `undefined` for the chain's coin */
export interface IEvmAssetChange {
  asset?: string;
  /** Of an NFT */
  tokenId?: string;
  /** Negative for what leaves the account */
  amount: string;
}

/** A right the user gives to move their assets */
export interface IEvmApprovalChange {
  asset: string;
  spender: string;
  /** Of a token; `undefined` for an NFT or a whole collection */
  amount?: string;
  tokenId?: string;
  isAll?: boolean;
  /** An allowance of Permit2, which expires */
  isPermit2?: boolean;
}

export type EvmSimulation =
  | {
    status: 'ok';
    changes: IEvmAssetChange[];
    /** The coin wrapped or unwrapped by WETH9-style events, a change only of an ERC-20 */
    wraps: IEvmAssetChange[];
    approvals: IEvmApprovalChange[];
    /** Events that move the user's assets in a way not read here, e.g. addresses in the data */
    hasUnreadEvents: boolean;
  }
  | { status: 'reverted'; reason?: string }
  | { status: 'insufficientFunds' }
  /** The node has no `eth_simulateV1`, e.g. Avalanche's */
  | { status: 'unsupported' }
  | { status: 'failed' };

interface ILog {
  address: string;
  topics: string[];
  data: string;
}

/** `traceTransfers` gives the coin's moves as ERC-20 transfers of one of these (geth, reth) */
const COIN_ADDRESSES = [
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  '0xfffffffffffffffffffffffffffffffffffffffe',
];
const ZERO_ADDRESS = `0x${'0'.repeat(40)}`;
const TOPICS = {
  transfer: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  approval: '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
  approvalForAll: '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31',
  transferSingle: '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
  transferBatch: '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb',
  // Deposit(address,uint256) and Withdrawal(address,uint256) of WETH9
  deposit: '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c',
  withdrawal: '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65',
  permit2Approval: '0xda9fa7c1b00402c17d0161b249b1ab8bbec047c5a52207b9c112deffd817036b',
  permit2Permit: '0xc6a377bfc4eb120024a8ac08eef205be16b817020812c73223e81d1bdb9708ec',
};
const SELECTOR_ALLOWANCE = '0xdd62ed3e';
const REASON_MAX_LENGTH = 200;

const isWord = (hex?: string) => typeof hex === 'string' && /^0x[\da-f]{64}$/.test(hex);
const toAddress = (topic: string) => `0x${topic.slice(26)}`;
const toUint = (hex: string) => BigInt(hex);
const toWord = (address: string) => address.toLowerCase().replace(/^0x/, '').padStart(64, '0');

/** The data of an event as words, `undefined` if it isn't whole words */
function getWords(data: string, count: number): string[] | undefined {
  if (!/^0x[\da-f]*$/.test(data) || data.length !== 2 + 64 * count) return undefined;
  return data.slice(2).match(/.{64}/g)!.map((word) => `0x${word}`);
}

/** All words of the data, none if it isn't whole words */
function getAllWords(data: string): string[] {
  return /^0x(?:[\da-f]{64})+$/.test(data) ? getWords(data, (data.length - 2) / 64)! : [];
}

/** The ids and amounts of an ERC-1155 batch, `undefined` if the data holds no such pair */
function getBatch(data: string): [string, bigint][] | undefined {
  try {
    const decoded = decodeParameters(['uint256[]', 'uint256[]'], data);
    const [ids, amounts] = [decoded[0], decoded[1]] as bigint[][];
    return (ids.length === amounts.length)
      ? ids.map((id, idx) => [id.toString(), amounts[idx]])
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * What a simulated call does to the assets of `owner`: the net change of each,
 * and the rights given on them. Only the standard events are read.
 * `spentApprovals` are of tokens the call also sends, which may only tell the allowance spent.
 */
export function readSimulatedLogs(rawLogs: unknown, owner: string) {
  const user = owner.toLowerCase();
  const userWord = `0x${toWord(user)}`;
  const balances = new Map<string, IEvmAssetChange>();
  const approvals: IEvmApprovalChange[] = [];
  const sentAssets = new Set<string>();
  const coinMoves: { from: string; to: string; amount: bigint }[] = [];
  const mints = new Set<string>();
  const burns = new Set<string>();
  const wrapEvents: { asset: string; emitter: string; amount: bigint; isDeposit: boolean }[] = [];
  let hasUnreadEvents = false;

  function addChange(asset: string | undefined, tokenId: string | undefined, delta: bigint) {
    const key = `${asset ?? ''}#${tokenId ?? ''}`;
    const previous = BigInt(balances.get(key)?.amount ?? 0);
    balances.set(key, { asset, tokenId, amount: (previous + delta).toString() });
  }

  function addTransfer(
    asset: string | undefined,
    from: string,
    to: string,
    amount: bigint,
    tokenId?: string,
  ) {
    // Sent to oneself it changes nothing; some nodes leave such transfers out
    if (from === user && to !== user) {
      addChange(asset, tokenId, -amount);
      if (asset) sentAssets.add(asset);
    } else if (to === user && from !== user) {
      addChange(asset, tokenId, amount);
    }
  }

  (Array.isArray(rawLogs) ? rawLogs : []).forEach((rawLog) => {
    const log = rawLog as ILog;
    if (typeof log?.address !== 'string' || !Array.isArray(log.topics)) return;
    const address = log.address.toLowerCase();
    const topics = log.topics.map((topic) => String(topic).toLowerCase());
    const data = String(log.data ?? '0x').toLowerCase();
    if (!topics.every(isWord)) return;
    // Old contracts, e.g. CryptoKitties, put the addresses in the data
    const mentionsUser = () => (
      topics.slice(1).some((topic) => toAddress(topic) === user)
      || getAllWords(data).includes(userWord)
    );
    const asset = COIN_ADDRESSES.includes(address) ? undefined : toChecksumAddress(address);

    switch (topics[0]) {
      case TOPICS.transfer: {
        const words = getWords(data, 1);
        if (topics.length === 3 && words) {
          const from = toAddress(topics[1]);
          const to = toAddress(topics[2]);
          const amount = toUint(words[0]);
          addTransfer(asset, from, to, amount);
          if (!asset) {
            coinMoves.push({ from, to, amount });
          } else if (from === ZERO_ADDRESS && to === user) {
            mints.add(asset);
          } else if (from === user && to === ZERO_ADDRESS) {
            burns.add(asset);
          }
        } else if (topics.length === 4 && data === '0x' && asset) {
          addTransfer(
            asset,
            toAddress(topics[1]),
            toAddress(topics[2]),
            BigInt(1),
            toUint(topics[3]).toString(),
          );
        } else if (mentionsUser()) {
          hasUnreadEvents = true;
        }
        return;
      }
      case TOPICS.transferSingle: {
        const words = getWords(data, 2);
        if (topics.length === 4 && words && asset) {
          addTransfer(
            asset,
            toAddress(topics[2]),
            toAddress(topics[3]),
            toUint(words[1]),
            toUint(words[0]).toString(),
          );
        } else if (mentionsUser()) {
          hasUnreadEvents = true;
        }
        return;
      }
      case TOPICS.transferBatch: {
        const batch = (topics.length === 4 && asset) ? getBatch(data) : undefined;
        if (batch) {
          batch.forEach(([tokenId, amount]) => addTransfer(
            asset,
            toAddress(topics[2]),
            toAddress(topics[3]),
            amount,
            tokenId,
          ));
        } else if (mentionsUser()) {
          hasUnreadEvents = true;
        }
        return;
      }
      case TOPICS.deposit:
      case TOPICS.withdrawal: {
        const words = getWords(data, 1);
        if (asset && topics.length === 2 && words && toAddress(topics[1]) === user) {
          wrapEvents.push({
            asset,
            emitter: address,
            amount: toUint(words[0]),
            isDeposit: topics[0] === TOPICS.deposit,
          });
        }
        return;
      }
      case TOPICS.approval: {
        if (!asset || toAddress(topics[1] ?? '') !== user) return;
        const words = getWords(data, 1);
        if (topics.length === 3 && words) {
          approvals.push({
            asset,
            spender: toChecksumAddress(toAddress(topics[2])),
            amount: toUint(words[0]).toString(),
          });
        } else if (topics.length === 4 && data === '0x') {
          approvals.push({
            asset,
            spender: toChecksumAddress(toAddress(topics[2])),
            tokenId: toUint(topics[3]).toString(),
          });
        }
        return;
      }
      case TOPICS.approvalForAll: {
        const words = getWords(data, 1);
        if (asset && topics.length === 3 && words && toAddress(topics[1]) === user) {
          approvals.push({
            asset,
            spender: toChecksumAddress(toAddress(topics[2])),
            isAll: toUint(words[0]) === BigInt(1),
          });
        }
        return;
      }
      case TOPICS.permit2Approval:
      case TOPICS.permit2Permit: {
        const words = getWords(data, topics[0] === TOPICS.permit2Approval ? 2 : 3);
        if (
          address === PERMIT2_ADDRESS.toLowerCase()
          && topics.length === 4
          && words
          && toAddress(topics[1]) === user
        ) {
          approvals.push({
            asset: toChecksumAddress(toAddress(topics[2])),
            spender: toChecksumAddress(toAddress(topics[3])),
            amount: toUint(words[0]).toString(),
            isPermit2: true,
          });
        }
        break;
      }
      default:
    }
  });

  // A wrap moves the coin as WETH9 does; WETH10-style tokens tell it with a mint or burn instead
  const wraps = new Map<string, bigint>();
  wrapEvents.forEach(({
    asset, emitter, amount, isDeposit,
  }) => {
    const [from, to] = isDeposit ? [user, emitter] : [emitter, user];
    const moveIdx = coinMoves.findIndex((move) => (
      move.from === from && move.to === to && move.amount === amount
    ));
    if (moveIdx === -1 || (isDeposit ? mints : burns).has(asset)) return;
    coinMoves.splice(moveIdx, 1);
    wraps.set(asset, (wraps.get(asset) ?? BigInt(0)) + (isDeposit ? amount : -amount));
  });

  // Removed rights take nothing, a sent NFT clears its approval to the zero address
  const isGranted = ({
    spender, amount, tokenId, isAll,
  }: IEvmApprovalChange) => (
    (isAll ?? (tokenId !== undefined || amount !== '0'))
    && BigInt(spender) !== BigInt(0)
  );
  // Spending an allowance lowers it, by e.g. OpenZeppelin's ERC-20 the event is the same.
  // Permit2 tells no spending.
  const isOfSentToken = ({ asset, amount, isPermit2 }: IEvmApprovalChange) => (
    amount !== undefined && !isPermit2 && sentAssets.has(asset)
  );
  const lastOfSentTokens = new Map(approvals
    .filter(isOfSentToken)
    .map((approval) => [`${approval.asset}#${approval.spender}`, approval]));

  return {
    changes: [...balances.values()].filter(({ amount }) => amount !== '0'),
    wraps: [...wraps]
      .filter(([, amount]) => amount !== BigInt(0))
      .map(([asset, amount]): IEvmAssetChange => ({ asset, amount: amount.toString() })),
    approvals: approvals.filter((approval) => isGranted(approval) && !isOfSentToken(approval)),
    spentApprovals: [...lastOfSentTokens.values()].filter(isGranted),
    hasUnreadEvents,
  };
}

/** The changes with the wraps of the coin netted in */
export function addWraps(changes: IEvmAssetChange[], wraps: IEvmAssetChange[]) {
  const result = changes.map((change) => ({ ...change }));
  wraps.forEach(({ asset, amount }) => {
    const change = result.find((item) => item.asset === asset && item.tokenId === undefined);
    if (change) {
      change.amount = (BigInt(change.amount) + BigInt(amount)).toString();
    } else {
      result.push({ asset, tokenId: undefined, amount });
    }
  });
  return result.filter(({ amount }) => amount !== '0');
}

/** The contract writes it: on one line, without invisible characters, and short */
function readRevertReason(message: unknown): string | undefined {
  if (typeof message !== 'string') return undefined;
  const text = message
    .replace(/\p{Cc}+/gu, ' ')
    .replace(/[^\P{C}]/gu, '')
    // More marks on one letter draw over the lines around it
    .replace(/(\p{M}{2})\p{M}+/gu, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  const chars = Array.from(text);
  if (!chars.length) return undefined;
  return (chars.length > REASON_MAX_LENGTH)
    ? `${chars.slice(0, REASON_MAX_LENGTH).join('')}…`
    : text;
}

/**
 * An approval of a token the call sends gives a right unless the allowance is as high already,
 * as spending it tells the same event. Told also when the node doesn't say.
 */
async function isAllowanceRaised(
  nodeUrl: string,
  owner: string,
  { asset, spender, amount }: IEvmApprovalChange,
) {
  try {
    const { result } = await evmNodeRequest<string>(nodeUrl, 'eth_call', [{
      to: asset,
      data: `${SELECTOR_ALLOWANCE}${toWord(owner)}${toWord(spender)}`,
    }, 'latest'], 3000);
    return !(typeof result === 'string'
      && /^0x[\da-f]{64}$/i.test(result)
      && BigInt(amount!) <= BigInt(result));
  } catch {
    return true;
  }
}

const UNSUPPORTED = /does not exist|not available|not supported|unsupported|not allowed|method not found/i;
const METHOD_NOT_FOUND = -32601;
const INSUFFICIENT_FUNDS = -38014;

const isUnsupported = ({ code, message }: { code: number; message?: string }) => (
  code === METHOD_NOT_FOUND || UNSUPPORTED.test(message ?? '')
);

const randomWord = () => bytesToHex(crypto.getRandomValues(new Uint8Array(32)));

/** About a block a second, where the node's block 12 s after the latest stands out */
const FAST_PROTOCOLS: Protocol[] = [PROTOCOLS.bnb, PROTOCOLS.polygonPos];

/** The number and time of the node's latest block, `undefined` when it doesn't tell */
async function getLatestBlock(nodeUrl: string) {
  try {
    const { result } = await evmNodeRequest<{ number?: unknown; timestamp?: unknown }>(
      nodeUrl,
      'eth_getBlockByNumber',
      ['latest', false],
      3000,
    );
    const isQuantity = (value: unknown): value is string => (
      typeof value === 'string' && /^0x[\da-f]+$/i.test(value)
    );
    return (isQuantity(result?.number) && isQuantity(result?.timestamp))
      ? { number: result!.number as string, time: BigInt(result!.timestamp as string) }
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The simulated block has 0 or a time where a drainer can read a real value: Ethereum's
 * randomness and beacon root, Polygon's difficulty, and 12 s after the latest block on
 * chains that make one about every second. BNB's difficulty is its own.
 */
function getBlockOverrides(protocol: Protocol, latestTime?: bigint) {
  // The node takes no time at or before the latest block's
  const time = (latestTime === undefined)
    ? {}
    : { time: `0x${(latestTime + BigInt(1)).toString(16)}` };
  switch (protocol) {
    case PROTOCOLS.ethereum:
      return { prevRandao: randomWord(), beaconRoot: randomWord() };
    case PROTOCOLS.polygonPos:
      return { difficulty: '0x1', ...time };
    case PROTOCOLS.bnb:
      return (latestTime === undefined) ? undefined : time;
    default:
      return undefined;
  }
}

/** Runs the call as it will be signed on the latest block of the node, and reads what it did */
export async function simulateEvmCall(
  nodeUrl: string,
  call: IEvmCall,
  protocol: Protocol,
): Promise<EvmSimulation> {
  const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = call;
  // Fees not set are left out; a call without any runs unvalidated
  const fees = { gasPrice, maxFeePerGas, maxPriorityFeePerGas };
  const hasFees = gasPrice !== undefined || maxFeePerGas !== undefined;
  // The time is set from the latest block, so the run is on that one: 'latest' may move on
  const latest = (hasFees && FAST_PROTOCOLS.includes(protocol))
    ? await getLatestBlock(nodeUrl)
    : undefined;
  const blockOverrides = getBlockOverrides(protocol, latest?.time);

  const request = (
    withFees: boolean,
    withOverrides = withFees,
  ) => evmNodeRequest(nodeUrl, 'eth_simulateV1', [{
    blockStateCalls: [{
      ...(withOverrides && blockOverrides) ? { blockOverrides } : {},
      calls: [{
        from: call.from,
        to: call.to,
        value: call.value,
        data: call.data,
        gas: call.gas,
        ...(withFees ? fees : {}),
      }],
    }],
    traceTransfers: true,
    // With the fees signed, the call sees the gas price and base fee it is mined with
    // (a drainer can tell 0 from a real one), and the balance must cover the fee too.
    // Without them, only the value is checked against the balance.
    validation: withFees,
  }, (withOverrides && latest) ? latest.number : 'latest'], 8000);

  try {
    let { result, error } = await request(hasFees);
    // A node may refuse the overrides or not know the block just read: run it as before
    if (
      error
      && hasFees
      && blockOverrides
      && error.code !== INSUFFICIENT_FUNDS
      && error.code !== METHOD_NOT_FOUND
    ) {
      ({ result, error } = await request(true, false));
    }
    // E.g. a base fee risen above the fee: preview as before rather than not at all
    if (error && hasFees && error.code !== INSUFFICIENT_FUNDS && !isUnsupported(error)) {
      ({ result, error } = await request(false));
    }

    if (error) {
      if (isUnsupported(error)) return { status: 'unsupported' };
      return (error.code === INSUFFICIENT_FUNDS)
        ? { status: 'insufficientFunds' }
        : { status: 'failed' };
    }
    const simulated = Array.isArray(result) ? result[0]?.calls?.[0] : undefined;
    if (simulated?.status === '0x0') {
      return { status: 'reverted', reason: readRevertReason(simulated.error?.message) };
    }
    if (simulated?.status !== '0x1') return { status: 'failed' };
    const { spentApprovals, ...read } = readSimulatedLogs(simulated.logs, call.from);
    const isRaised = await Promise.all(
      spentApprovals.map((approval) => isAllowanceRaised(nodeUrl, call.from, approval)),
    );
    return {
      status: 'ok',
      ...read,
      approvals: [...read.approvals, ...spentApprovals.filter((_, idx) => isRaised[idx])],
    };
  } catch {
    return { status: 'failed' };
  }
}
