import { omit } from 'lodash-es';
import { IS_OFFSCREEN_TAB } from '@/constants';
import { watchUntilTruthy } from '@/utils';
import { ref } from 'vue';

/**
 * Before version 2.0.2 we were using Vuex and the whole state was kept as
 * one browser/local storage entry.
 */
export const collectVuexState = (() => {
  let vuexState: Record<string, any> | null;
  const isCollecting = ref(false);
  return async () => {
    if (window?.browser) {
      if (isCollecting.value) {
        await watchUntilTruthy(() => !isCollecting.value);
      } else if (!vuexState && !IS_OFFSCREEN_TAB) {
        isCollecting.value = true;
        try {
          vuexState = (await window.browser.storage.local.get('state'))?.state as any;
        } finally {
          // Or a failed read would hold up the invites to be stored for good
          isCollecting.value = false;
        }
      }
    }
    return vuexState;
  };
})();

/** The Vuex state stored now, which another window may have changed since it was collected. */
export async function readStoredVuexState(): Promise<Record<string, any> | undefined> {
  if (!window?.browser || IS_OFFSCREEN_TAB) {
    return undefined;
  }
  return (await window.browser.storage.local.get('state'))?.state as any;
}

type LegacyValueCheck = (value: any) => boolean;

let legacySecretsRemoval = Promise.resolve();

/**
 * The Vuex state, and the entries stored before it, kept secrets in plaintext.
 * Removes the state fields and the entries whose value passes its check.
 * The other state fields stay, as migrations read them lazily.
 */
export function removeLegacySecrets({
  stateFields = {},
  entries = {},
  confirm,
}: {
  stateFields?: Record<string, LegacyValueCheck>;
  entries?: Record<string, LegacyValueCheck>;
  /** Asked only when there is something to remove. */
  confirm?: () => Promise<boolean>;
}): Promise<void> {
  if (!window?.browser || IS_OFFSCREEN_TAB) {
    return Promise.resolve();
  }
  const pickRemovable = (checks: Record<string, LegacyValueCheck>, values: Record<string, any>) => (
    Object.keys(checks).filter((key) => values[key] !== undefined && checks[key](values[key]))
  );
  // Queued, so that two removals don't write back each other's fields.
  const removal = legacySecretsRemoval.then(async () => {
    const storage = window.browser.storage.local;
    const stored: Record<string, any> = await storage.get(['state', ...Object.keys(entries)]);
    const fieldsToRemove = pickRemovable(stateFields, stored.state || {});
    const entriesToRemove = pickRemovable(entries, stored);
    if (
      (!fieldsToRemove.length && !entriesToRemove.length)
      || (confirm && !await confirm())
    ) {
      return;
    }
    if (fieldsToRemove.length) {
      await storage.set({ state: omit(stored.state, fieldsToRemove) });
      // Or the migrations reading it later would bring them back.
      const cachedState = await collectVuexState();
      fieldsToRemove.forEach((field) => delete cachedState?.[field]);
    }
    if (entriesToRemove.length) {
      await storage.remove(entriesToRemove);
    }
  });
  legacySecretsRemoval = removal.catch(() => {});
  return removal;
}
