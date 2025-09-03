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
            v-if="hasSuperheroId"
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
import { defineComponent, ref } from 'vue';

import { ROUTE_ADDRESS_BOOK_ADD } from '@/popup/router/routeNames';
import {
  useAddressBook,
  useModals,
  useAccounts,
} from '@/composables';
import { useSuperheroId } from '@/composables/superheroId';

import AddressBookList from '@/popup/components/AddressBook/AddressBookList.vue';
import BtnBox from '@/popup/components/buttons/BtnBox.vue';

import AddIcon from '@/icons/plus-circle.svg?vue-component';
import ImportIcon from '@/icons/import-address-book.svg?vue-component';
import ExportIcon from '@/icons/export-address-book.svg?vue-component';
import { handleUnknownError } from '@/utils';

export default defineComponent({
  components: {
    IonPage,
    AddressBookList,
    BtnBox,
  },
  setup() {
    const hideButtons = ref(false);

    const { exportAddressBook, importAddressBook, addressBook } = useAddressBook();
    const { openDefaultModal } = useModals();
    const { aeAccounts } = useAccounts();
    const { syncAddressBook, hasSuperheroId } = useSuperheroId();

    const isSyncing = ref(false);

    async function onSyncAddressBook() {
      try {
        isSyncing.value = true;
        const addr = aeAccounts.value?.[0]?.address as `ak_${string}`;
        if (!addr) throw new Error('No æternity account');
        await syncAddressBook(JSON.stringify(addressBook.value));
        openDefaultModal({ title: 'Superhero ID', msg: 'Address Book Sync with SH ID completed' });
      } catch (e) {
        openDefaultModal({ title: 'Superhero ID', msg: 'Sync failed' });
        handleUnknownError(e);
      } finally {
        isSyncing.value = false;
      }
    }

    return {
      hideButtons,
      exportAddressBook,
      importAddressBook,
      onSyncAddressBook,
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
