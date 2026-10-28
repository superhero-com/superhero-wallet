// @ts-nocheck
import { NETWORK_TYPE_MAINNET, PROTOCOLS } from '@/constants';
import { decodeTxData } from '@/protocols/ethereum/helpers';
import { EtherscanService } from '@/protocols/ethereum/libs/EtherscanService';
import { ETH_NETWORK_ADDITIONAL_SETTINGS } from '@/protocols/ethereum/config';
import { BNB_NETWORK_ADDITIONAL_SETTINGS } from '@/protocols/bnb/config';
import { AVALANCHE_NETWORK_ADDITIONAL_SETTINGS } from '@/protocols/avalanche/config';
import { POLYGON_NETWORK_ADDITIONAL_SETTINGS } from '@/protocols/polygonPos/config';

const FROM = '0x1111111111111111111111111111111111111111';
const TOKEN = '0x55d398326f99059fF775485246999027B3197955';
const SPENDER = '0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af';
const RECIPIENT = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
const MAX_UINT256 = 2n ** 256n - 1n;

const pad = (hex: string) => hex.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const TRANSFER_DATA = `0xa9059cbb${pad(RECIPIENT)}${pad((1000n).toString(16))}`;
const APPROVE_DATA = `0x095ea7b3${pad(SPENDER)}${'f'.repeat(64)}`;
// swapExactTokensForTokens selector, not an ERC-20 one
const OTHER_DATA = `0x38ed1739${'0'.repeat(64)}`;

describe('decodeTxData', () => {
  let etherscanCalls;

  beforeEach(() => {
    etherscanCalls = [];
    vi.spyOn(EtherscanService.prototype, 'fetchFromApi').mockImplementation(
      async function fetchFromApi(params) {
        etherscanCalls.push({ apiUrl: this.apiUrl, chainId: this.chainId, ...params });
        return { status: '0', message: 'NOTOK', result: '' };
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('decodes an ERC-20 transfer without asking Etherscan', async () => {
    const decoded = await decodeTxData(TRANSFER_DATA, TOKEN, FROM, PROTOCOLS.bnb);

    expect(etherscanCalls).toEqual([]);
    expect(decoded.functionName).toBe('transfer');
    expect(decoded.args[0]).toBe(RECIPIENT);
    expect(decoded.args[1]).toBe(1000n);
  });

  it('decodes an ERC-20 transfer in uppercase hex', async () => {
    const decoded = await decodeTxData(
      `0x${TRANSFER_DATA.slice(2).toUpperCase()}`,
      TOKEN,
      FROM,
      PROTOCOLS.bnb,
    );

    expect(decoded.functionName).toBe('transfer');
    expect(decoded.args[0]).toBe(RECIPIENT);
    expect(decoded.args[1]).toBe(1000n);
  });

  it('decodes an unlimited approval with its spender and amount', async () => {
    const decoded = await decodeTxData(APPROVE_DATA, TOKEN, FROM, PROTOCOLS.ethereum);

    expect(etherscanCalls).toEqual([]);
    expect(decoded.functionName).toBe('approve');
    expect(decoded.args[0]).toBe(SPENDER);
    expect(decoded.args[1]).toBe(MAX_UINT256);
  });

  // Snowtrace for Avalanche, the Etherscan API of each chain for the rest
  it.each([
    [PROTOCOLS.ethereum, '1', ETH_NETWORK_ADDITIONAL_SETTINGS],
    [PROTOCOLS.bnb, '56', BNB_NETWORK_ADDITIONAL_SETTINGS],
    [PROTOCOLS.avalanche, '43114', AVALANCHE_NETWORK_ADDITIONAL_SETTINGS],
    [PROTOCOLS.polygonPos, '137', POLYGON_NETWORK_ADDITIONAL_SETTINGS],
  ])('asks the explorer API for the ABI on the %s chain', async (protocol, chainId, settings) => {
    expect(await decodeTxData(OTHER_DATA, TOKEN, FROM, protocol)).toBeUndefined();

    expect(etherscanCalls).toEqual([
      expect.objectContaining({
        apiUrl: settings[NETWORK_TYPE_MAINNET].middlewareUrl.trim(),
        chainId,
        action: 'getabi',
        address: TOKEN,
      }),
    ]);
  });
});
