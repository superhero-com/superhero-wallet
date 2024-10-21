<template>
  <PageWrapper
    class="address-book-wrapper"
    :page-title="$t('pages.titles.addressBook')"
  >
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
        </div>
      </Transition>

      <AddressBookList
        v-model:hideButtons="hideButtons"
        @select-address="handleSelectAddress"
      />
    </div>
  </PageWrapper>
</template>

<script lang="ts">
import { useIonRouter } from '@ionic/vue';
import { defineComponent, ref } from 'vue';

import { ROUTE_ADDRESS_BOOK_ADD, ROUTE_ADDRESS_BOOK_EDIT } from '@/popup/router/routeNames';
import { useAddressBook } from '@/composables';

import PageWrapper from '@/popup/components/PageWrapper.vue';
import AddressBookList from '@/popup/components/AddressBook/AddressBookList.vue';
import BtnBox from '@/popup/components/buttons/BtnBox.vue';

import AddIcon from '@/icons/plus-circle.svg?vue-component';
import ImportIcon from '@/icons/import-address-book.svg?vue-component';
import ExportIcon from '@/icons/export-address-book.svg?vue-component';

export default defineComponent({
  components: {
    PageWrapper,
    AddressBookList,
    BtnBox,
  },
  setup() {
    const hideButtons = ref(false);

    const router = useIonRouter();
    const { exportAddressBook, importAddressBook } = useAddressBook();

    function handleSelectAddress(address: string) {
      router.push({ name: ROUTE_ADDRESS_BOOK_EDIT, params: { id: address } });
    }

    return {
      hideButtons,

      exportAddressBook,
      importAddressBook,
      handleSelectAddress,

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
