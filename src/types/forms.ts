import { Protocol } from '@/types/protocols';

export interface IFormSelectOption {
  text: string;
  value: string | number;
  address?: string; // Account address
  name?: string; // Account name
  idx?: number; // Account idx
  protocol?: Protocol; // Account protocol
}
