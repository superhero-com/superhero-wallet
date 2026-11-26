import {
  decodeEvmCallIntent,
  isUnlimitedAmount,
  PERMIT2_ADDRESS,
} from '@/protocols/evm/helpers/decodeEvmCallIntent';
import { callData, SELECTORS, word } from '../../../helpers/evmAbi';

const TOKEN = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const OWNER = '0x1111111111111111111111111111111111111111';
const SPENDER = '0x000000000000000000000000000000000000dEaD';
const MAX_UINT256 = 2n ** 256n - 1n;

describe('decodeEvmCallIntent', () => {
  it.each([
    ['transfer', callData(SELECTORS.transfer, SPENDER, 1000n), {
      kind: 'transfer', token: TOKEN, recipient: SPENDER, amount: '1000',
    }],
    ['approve', callData(SELECTORS.approve, SPENDER, MAX_UINT256), {
      kind: 'approve', token: TOKEN, spender: SPENDER, amount: MAX_UINT256.toString(),
    }],
    ['increaseAllowance', callData(SELECTORS.increaseAllowance, SPENDER, 5n), {
      kind: 'increaseAllowance', token: TOKEN, spender: SPENDER, amount: '5',
    }],
    ['transferFrom', callData(SELECTORS.transferFrom, OWNER, SPENDER, 7n), {
      kind: 'transferFrom', token: TOKEN, from: OWNER, recipient: SPENDER, amount: '7',
    }],
    ['setApprovalForAll', callData(SELECTORS.setApprovalForAll, SPENDER, 1n), {
      kind: 'approveAll', collection: TOKEN, operator: SPENDER, approved: true,
    }],
    ['setApprovalForAll revoking', callData(SELECTORS.setApprovalForAll, SPENDER, 0n), {
      kind: 'approveAll', collection: TOKEN, operator: SPENDER, approved: false,
    }],
    ['safeTransferFrom', callData(SELECTORS.safeTransferFrom, OWNER, SPENDER, 42n), {
      kind: 'nftTransfer', collection: TOKEN, from: OWNER, recipient: SPENDER, tokenId: '42',
    }],
    // The `bytes` argument: its offset, length and data
    ['safeTransferFrom with data', callData(SELECTORS.safeTransferFromWithData, OWNER, SPENDER, 42n, 128n, 1n, `0x${'ab'.padEnd(64, '0')}`), {
      kind: 'nftTransfer', collection: TOKEN, from: OWNER, recipient: SPENDER, tokenId: '42',
    }],
    ['ERC-1155 safeTransferFrom', callData(SELECTORS.erc1155SafeTransferFrom, OWNER, SPENDER, 42n, 3n, 160n, 0n), {
      kind: 'nftTransfer', collection: TOKEN, from: OWNER, recipient: SPENDER, tokenId: '42', amount: '3',
    }],
    // USDC and USDT drop the upper bits of an address, as tokens before Solidity 0.8 do
    ['an address with dirty upper bits', `${SELECTORS.transfer}${'f'.repeat(24)}${OWNER.slice(2)}${word(1n)}`, {
      kind: 'transfer', token: TOKEN, recipient: OWNER, amount: '1',
    }],
    // BAYC grants all for any bool but 0
    ['a bool other than 0 or 1', callData(SELECTORS.setApprovalForAll, SPENDER, 2n), {
      kind: 'approveAll', collection: TOKEN, operator: SPENDER, approved: true,
    }],
  ])('reads %s', (_, data, intent) => {
    expect(decodeEvmCallIntent(TOKEN, data)).toEqual(intent);
  });

  it('reads an approve of Permit2', () => {
    const data = callData(SELECTORS.permit2Approve, TOKEN, SPENDER, 2n ** 160n - 1n, 1795000000n);

    expect(decodeEvmCallIntent(PERMIT2_ADDRESS.toLowerCase(), data)).toEqual({
      kind: 'permit2Approve',
      token: TOKEN,
      spender: SPENDER,
      amount: (2n ** 160n - 1n).toString(),
      expiration: '1795000000',
    });
  });

  it('reads the selector of Permit2 only on Permit2', () => {
    const data = callData(SELECTORS.permit2Approve, TOKEN, SPENDER, 1n, 1n);

    expect(decodeEvmCallIntent(TOKEN, data)).toBeUndefined();
  });

  it('reads upper-case hex', () => {
    const data = `0x${callData(SELECTORS.transfer, SPENDER, 1000n).slice(2).toUpperCase()}`;

    expect(decodeEvmCallIntent(TOKEN, data)).toMatchObject({ kind: 'transfer', amount: '1000' });
  });

  it('ignores data appended after the arguments, as the contract does', () => {
    const data = `${callData(SELECTORS.transfer, SPENDER, 1000n)}deadbeef`;

    expect(decodeEvmCallIntent(TOKEN, data)).toMatchObject({ kind: 'transfer', amount: '1000' });
  });

  it.each([
    ['other calls', callData('0x38ed1739', 1n, 2n)],
    ['no call data', '0x'],
    ['missing arguments', callData(SELECTORS.transfer, SPENDER)],
    // Permit2 reverts on it
    ['a uint48 out of range', callData(SELECTORS.permit2Approve, TOKEN, SPENDER, 1n, 2n ** 48n)],
    ['odd-length hex', `${callData(SELECTORS.transfer, SPENDER, 1n)}0`],
    ['not hex', `${SELECTORS.transfer}${'z'.repeat(128)}`],
  ])('gives nothing for %s', (_, data) => {
    expect(decodeEvmCallIntent(PERMIT2_ADDRESS, data)).toBeUndefined();
  });

  it('gives nothing for a contract that is not an address', () => {
    expect(decodeEvmCallIntent('', callData(SELECTORS.transfer, SPENDER, 1n))).toBeUndefined();
  });

  it.each([
    [MAX_UINT256, true],
    [2n ** 160n - 1n, true],
    [2n ** 128n, true],
    [2n ** 128n - 1n, false],
    // 1e9 tokens of 18 decimals
    [10n ** 27n, false],
  ])('tells %s unlimited: %s', (amount, isUnlimited) => {
    expect(isUnlimitedAmount(amount.toString())).toBe(isUnlimited);
  });
});
