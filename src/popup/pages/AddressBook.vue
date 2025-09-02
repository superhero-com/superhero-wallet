<template>
  <IonPage>
    <div class="address-book">
      <Transition name="slide-transition">
        <div
          v-if="!hideButtons"
          class="buttons"
        >
          <BtnBox
            data-cy="add-address"
            :to="{ name: ROUTE_ADDRESS_BOOK_ADD }"
            :text="$t('pages.addressBook.addAddress')"
            :icon="AddIcon"
          />
          <BtnBox
            data-cy="import-address-book"
            :text="$t('pages.addressBook.importAddressBook')"
            :icon="ImportIcon"
            @click="importAddressBook()"
          />
          <BtnBox
            data-cy="export-address-book"
            :text="$t('pages.addressBook.exportAddressBook')"
            :icon="ExportIcon"
            @click="exportAddressBook()"
          />
          <BtnBox
            v-if="isSuperheroConnected && hasSuperheroId"
            data-cy="sync-address-book"
            :text="isSyncing ? 'Syncing…' : 'Sync'"
            :disabled="isSyncing"
            :icon="ExportIcon"
            @click="onSyncAddressBook"
          />
        </div>
      </Transition>

      <AddressBookList v-model:hide-buttons="hideButtons" />
    </div>
  </IonPage>
</template>

<script lang="ts">
import { IonPage } from '@ionic/vue';
import { defineComponent, onMounted, ref } from 'vue';

import { ROUTE_ADDRESS_BOOK_ADD } from '@/popup/router/routeNames';
import {
  useAddressBook,
  useAeSdk,
  useModals,
  useAccounts,
} from '@/composables';
import { MODAL_CONFIRM_TRANSACTION_SIGN, PROTOCOLS } from '@/constants';
import { SuperheroIDService } from '@/protocols/aeternity/libs/SuperheroIDService';
import { unpackTx } from '@aeternity/aepp-sdk';

import AddressBookList from '@/popup/components/AddressBook/AddressBookList.vue';
import BtnBox from '@/popup/components/buttons/BtnBox.vue';

import AddIcon from '@/icons/plus-circle.svg?vue-component';
import ImportIcon from '@/icons/import-address-book.svg?vue-component';
import ExportIcon from '@/icons/export-address-book.svg?vue-component';

export default defineComponent({
  components: {
    IonPage,
    AddressBookList,
    BtnBox,
  },
  setup() {
    const hideButtons = ref(false);

    const { exportAddressBook, importAddressBook, addressBook } = useAddressBook();
    const { openDefaultModal, openModal } = useModals();
    const { aeAccounts } = useAccounts();
    const { getAeSdk } = useAeSdk();

    const isSuperheroConnected = ref(false);
    const hasSuperheroId = ref(false);
    const isSyncing = ref(false);

    async function onSyncAddressBook() {
      try {
        isSyncing.value = true;
        const addr = aeAccounts.value?.[0]?.address as `ak_${string}`;
        if (!addr) throw new Error('No æternity account');
        const svc = new SuperheroIDService();
        const txBase64 = await svc.buildSetIdTx(JSON.stringify(addressBook.value)) as any;
        const tx = unpackTx(txBase64) as any;
        await openModal(MODAL_CONFIRM_TRANSACTION_SIGN, {
          txBase64,
          tx,
          protocol: PROTOCOLS.aeternity,
          app: { host: window.location.origin, href: window.location.origin },
        });
        const aeSdk = await getAeSdk();
        const signed = await aeSdk.signTransaction(txBase64, { fromAccount: addr } as any);
        const { txHash } = await aeSdk.api.postTransaction({ tx: signed });
        await aeSdk.poll(txHash);
        openDefaultModal({ title: 'Address Book', msg: 'Synced to Superhero ID' });
      } catch (e) {
        openDefaultModal({ title: 'Address Book', msg: 'Sync failed' });
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        isSyncing.value = false;
      }
    }

    onMounted(async () => {
      try {
        const addr = aeAccounts.value?.[0]?.address as `ak_${string}`;
        if (!addr) return;
        const svc = new SuperheroIDService();
        const exists = await svc.hasId();
        isSuperheroConnected.value = true;
        hasSuperheroId.value = !!exists;
      } catch {
        isSuperheroConnected.value = false;
        hasSuperheroId.value = false;
      }
    });

    return {
      hideButtons,
      exportAddressBook,
      importAddressBook,
      onSyncAddressBook,
      isSuperheroConnected,
      hasSuperheroId,
      isSyncing,
      AddIcon,
      ImportIcon,
      ExportIcon,
      ROUTE_ADDRESS_BOOK_ADD,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.address-book {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 8px;
  background-color: $color-bg-app;

  .buttons {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    margin-top: 16px;
    padding-inline: 8px;
  }
}
</style>
