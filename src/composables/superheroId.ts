import {
  Ref,
  ref,
  watch,
  computed,
} from 'vue';
import { SuperheroIDService } from '@/protocols/aeternity/libs/SuperheroIDService';
import type { Encoded } from '@aeternity/aepp-sdk';
import { useAccounts } from '@/composables/accounts';
import { useAeSdk } from '@/composables/aeSdk';
import { useModals } from '@/composables/modals';
import { MODAL_CONFIRM_TRANSACTION_SIGN, PROTOCOLS } from '@/constants';
import { unpackTx } from '@aeternity/aepp-sdk';
import { useNetworks } from '@/composables/networks';
import { useAddressBook } from '@/composables/addressBook';

const superheroSvcRef = ref<SuperheroIDService | null>(null);
const hasSuperheroIdRef = ref(false);

export function useSuperheroId(): {
  superheroSvc: Ref<SuperheroIDService | null>;
  hasSuperheroId: Ref<boolean>;
  refreshHasSuperheroId: () => Promise<void>;
  syncAddressBook: (json: string) => Promise<void>;
  loadAddressBook: () => Promise<void>;
} { // eslint-disable-line
  const { aeAccounts } = useAccounts();
  const { getAeSdk } = useAeSdk();
  const { openModal } = useModals();
  const { addAddressBookEntriesFromJson } = useAddressBook();

  const firstAeAddress = computed(() => (
    aeAccounts.value?.[0]?.address as Encoded.AccountAddress | undefined));

  const svcRef = superheroSvcRef as unknown as Ref<SuperheroIDService | null>;

  async function refreshHasSuperheroId(): Promise<void> {
    const addr = firstAeAddress.value;
    if (!addr) {
      hasSuperheroIdRef.value = false;
      return;
    }
    const svc = superheroSvcRef.value || new SuperheroIDService();
    try {
      hasSuperheroIdRef.value = await svc.hasId();
    } catch {
      hasSuperheroIdRef.value = false;
    }
  }

  async function syncAddressBook(json: string): Promise<void> {
    const addr = firstAeAddress.value;
    if (!addr) throw new Error('No æternity account');
    if (!superheroSvcRef.value) throw new Error('Connect Superhero ID first');
    const svc = superheroSvcRef.value;
    const txBase64 = await svc.buildSetIdTx(json) as Encoded.Transaction;
    const tx = unpackTx(txBase64) as any;
    await openModal(MODAL_CONFIRM_TRANSACTION_SIGN, {
      txBase64,
      tx,
      protocol: PROTOCOLS.aeternity,
      app: { host: window.location.origin, href: window.location.origin },
    });
    const aeSdk = await getAeSdk();
    const signed = await aeSdk
      .signTransaction(txBase64, { fromAccount: addr } as any) as Encoded.Transaction;
    const { txHash } = await aeSdk.api.postTransaction({ tx: signed as Encoded.Transaction });
    await aeSdk.poll(txHash);
    hasSuperheroIdRef.value = true;
  }

  async function loadAddressBook() {
    const addr = firstAeAddress.value;
    if (!addr) throw new Error('No æternity account');
    const svc = superheroSvcRef.value || new SuperheroIDService();
    const val = await svc.getId();
    hasSuperheroIdRef.value = !!val;
    if (val) {
      addAddressBookEntriesFromJson(val, false);
    }
  }

  // Re-init on network change if an AE account exists
  const { onNetworkChange } = useNetworks();
  onNetworkChange(async () => {
    await refreshHasSuperheroId();
  });

  // Auto-initialize service when first AE account is available; clear on removal
  watch(
    () => firstAeAddress.value,
    async (addr) => {
      if (addr) {
        if (!superheroSvcRef.value) superheroSvcRef.value = new SuperheroIDService();
        await refreshHasSuperheroId();
      } else {
        superheroSvcRef.value = null;
        hasSuperheroIdRef.value = false;
      }
    },
    { immediate: true },
  );

  return {
    superheroSvc: svcRef,
    hasSuperheroId: hasSuperheroIdRef,
    refreshHasSuperheroId,
    syncAddressBook,
    loadAddressBook,
  };
}
