/**
 * Cryptocurrency related helper functions
 */

import BigNumber from 'bignumber.js';
import type { BigNumberPublic } from '@/types';

export function convertToken(balance: number | string, precision: number): BigNumberPublic {
  return new BigNumber(balance).shiftedBy(precision);
}
