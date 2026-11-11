import type { Ref } from 'vue';
import type { VaultKey } from '@/lib/WalletVault';

interface VaultRefBinding {
  storageKey: VaultKey;
  /** Apply committed ciphertext without starting another storage write. */
  apply: (value: string | null) => void;
}

const bindings = new WeakMap<object, VaultRefBinding>();

export function registerVaultRef(state: Ref, binding: VaultRefBinding) {
  bindings.set(state, binding);
}

export function getVaultRef(state: Ref): VaultRefBinding | undefined {
  return bindings.get(state);
}

type GetLatestWrite = () => Promise<void>;
const latestWrites = new WeakMap<object, GetLatestWrite>();

/** Outside the vault, a storage ref is written by its watcher after the change. */
export function registerStorageRefWrites(state: Ref, getLatestWrite: GetLatestWrite) {
  latestWrites.set(state, getLatestWrite);
}

export function getStorageRefWrites(state: Ref): GetLatestWrite | undefined {
  return latestWrites.get(state);
}
