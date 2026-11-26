import { evmNodeRequest } from './evmNodeRequest';

export interface IEvmTokenMeta {
  symbol?: string;
  /** Set for an ERC-20 token */
  decimals?: number;
  isNft?: boolean;
}

const SELECTOR_DECIMALS = '0x313ce567';
const SELECTOR_SYMBOL = '0x95d89b41';
// supportsInterface(0x80ac58cd), the ERC-721 interface
const DATA_SUPPORTS_ERC721 = `0x01ffc9a780ac58cd${'0'.repeat(56)}`;

async function call(nodeUrl: string, to: string, data: string): Promise<string | undefined> {
  const { result } = await evmNodeRequest<string>(nodeUrl, 'eth_call', [{ to, data }, 'latest'])
    .catch(() => ({ result: undefined }));
  return (typeof result === 'string' && /^0x[\da-f]+$/i.test(result)) ? result : undefined;
}

function decodeSymbol(hex?: string): string | undefined {
  if (!hex || hex.length % 2) return undefined;
  const bytes = Buffer.from(hex.slice(2), 'hex');
  let text: string;
  if (bytes.length === 32) {
    // bytes32, as old tokens (e.g. MKR) have it
    text = bytes.toString('utf8').replace(/\0+$/, '');
  } else if (bytes.length >= 64) {
    const offset = Number(BigInt(`0x${bytes.subarray(0, 32).toString('hex')}`));
    if (offset + 32 > bytes.length) return undefined;
    const length = Number(BigInt(`0x${bytes.subarray(offset, offset + 32).toString('hex')}`));
    if (offset + 32 + length > bytes.length) return undefined;
    text = bytes.subarray(offset + 32, offset + 32 + length).toString('utf8');
  } else {
    return undefined;
  }
  // A token picks its own symbol: no control characters, and short
  const symbol = text.replace(/[^\P{C}]/gu, '').trim();
  return (symbol && symbol.length <= 32) ? symbol : undefined;
}

/** The symbol and decimals of a token or the symbol of an NFT collection, as far as known */
export async function getEvmTokenMeta(nodeUrl: string, contract: string): Promise<IEvmTokenMeta> {
  const [decimalsHex, symbolHex] = await Promise.all([
    call(nodeUrl, contract, SELECTOR_DECIMALS),
    call(nodeUrl, contract, SELECTOR_SYMBOL),
  ]);
  const symbol = decodeSymbol(symbolHex);
  const decimals = decimalsHex ? BigInt(decimalsHex) : undefined;
  if (decimals !== undefined && decimals <= BigInt(255)) {
    return { symbol, decimals: Number(decimals) };
  }
  const supportsErc721 = await call(nodeUrl, contract, DATA_SUPPORTS_ERC721);
  return {
    symbol,
    isNft: !!supportsErc721 && BigInt(supportsErc721) === BigInt(1),
  };
}

/** `false` for an account, also one with EIP-7702 code; `undefined` when the node doesn't tell */
export async function fetchIsEvmContract(
  nodeUrl: string,
  address: string,
): Promise<boolean | undefined> {
  const { result } = await evmNodeRequest<string>(nodeUrl, 'eth_getCode', [address, 'latest'])
    .catch(() => ({ result: undefined }));
  if (typeof result !== 'string') return undefined;
  return result !== '0x' && !result.toLowerCase().startsWith('0xef0100');
}
