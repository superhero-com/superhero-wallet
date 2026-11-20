import { getEvmAssetLabel } from '@/protocols/evm/helpers/formatEvmAsset';

const TOKEN = '0x5555555555555555555555555555555555555555';

describe('getEvmAssetLabel', () => {
  it.each([
    'USDC.e',
    'USD₮0',
    '$WIF',
    '1INCH',
    'Cake-LP',
    'USD+',
    '币安人生',
    // Two marks on a letter, as some scripts have
    'e\u0301\u0302',
  ])('shows the symbol %j', (symbol) => {
    expect(getEvmAssetLabel(TOKEN, { symbol, decimals: 6 })).toBe(symbol);
  });

  it.each([
    // A fake USDC with the address of the real one, as the incoming tokens are told
    'USDC (0xA0b8…eB48)',
    'ATOS(VERIFIED)',
    'USDC（PoS）',
    'USDC ',
    'ETH:USDC',
    '🔶',
    // Marks stacked over the lines around
    'U\u0301\u0301\u0301',
    '',
    undefined,
  ])('shows the address for the symbol %j', (symbol) => {
    expect(getEvmAssetLabel(TOKEN, { symbol, decimals: 6 })).toBe('0x5555…5555');
  });
});
