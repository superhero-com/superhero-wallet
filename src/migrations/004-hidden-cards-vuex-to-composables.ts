import type { Migration } from '@/types';
import { collectVuexState } from './migrationHelpers';

const migration: Migration<string[]> = async (restoredValue: string[]) => {
  if (!restoredValue?.length) {
    const hiddenCards = (await collectVuexState())?.hiddenCards;
    if (hiddenCards?.length) {
      return hiddenCards;
    }
  }
  return restoredValue;
};

export default migration;
