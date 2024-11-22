<template>
  <Modal
    class="address-book-account-selector"
    has-close-button
    full-screen
    from-bottom
    @close="resolve"
  >
    <IonPage>
      <h2
        class="header"
        v-text="(
          isSigner ? $t('pages.addressBook.selectSignerAddress') : $t('pages.addressBook.selectRecipientAddress')
        )"
      />
      <AddressBookList
        is-selector
        @select-address="handleSelectAddress"
      />
    </IonPage>
  </Modal>
</template>

<script lang="ts">
import {
  defineComponent,
  onBeforeMount,
  onUnmounted,
  PropType,
} from 'vue';
import { IonPage } from '@ionic/vue';

import type { ResolveCallback, RejectCallback, Protocol } from '@/types';
import { useAccounts, useAddressBook } from '@/composables';

import Modal from '@/popup/components/Modal.vue';
import AddressBookList from '@/popup/components/AddressBook/AddressBookList.vue';

export default defineComponent({
  components: {
    IonPage,
    Modal,
    AddressBookList,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    protocol: { type: String as PropType<Protocol>, default: null },
    isSigner: Boolean,
  },
  setup(props) {
    const { activeAccount } = useAccounts();
    const { setProtocolFilter } = useAddressBook();

    function handleSelectAddress(address: string) {
      props.resolve(address);
    }

    onBeforeMount(() => {
      setProtocolFilter(props.protocol ?? activeAccount.value?.protocol);
    });

    onUnmounted(() => {
      setProtocolFilter(null);
    });

    return {
      handleSelectAddress,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.address-book-account-selector {
  .header {
    @extend %face-sans-15-medium;

    padding: 8px 16px;
    color: rgba($color-white, 0.75);
  }
}
</style>
