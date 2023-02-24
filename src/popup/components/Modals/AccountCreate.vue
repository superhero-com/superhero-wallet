<template>
  <Modal
    class="account-create"
    from-bottom
    has-close-button
    centered
    @close="resolve"
  >
    <h2 class="text-heading-2">
      {{
        isMultisig
          ? $t('modals.createAccount.titleMultisig')
          : $t('modals.createAccount.title')
      }}
    </h2>

    <p class="message">
      {{
        isMultisig
          ? $t('modals.createAccount.msgMultisig')
          : $t('modals.createAccount.msg')
      }}
    </p>

    <BtnSubheader
      v-if="!isMultisig"
      :header="$t('modals.createAccount.btnText')"
      :subheader="$t('modals.createAccount.btnSubtitle')"
      :icon="PlusCircleIcon"
      @click="createPlainAccount()"
    />
    <BtnSubheader
      :header="$t('modals.createMultisigAccount.btnText')"
      :subheader="$t('modals.createMultisigAccount.btnSubtitle')"
      :icon="PlusCircleIcon"
      @click="createMultisigAccount()"
    />

    <Loader v-if="loading" />
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';
import { MODAL_MULTISIG_VAULT_CREATE } from '../../utils';
import BtnSubheader from '../buttons/BtnSubheader.vue';
import Modal from '../Modal.vue';
import PlusCircleIcon from '../../../icons/plus-circle-fill.svg?vue-component';
import Loader from '../Loader.vue';

export default defineComponent({
  components: {
    Modal,
    BtnSubheader,
    Loader,
  },
  props: {
    resolve: { type: Function as PropType<() => void>, required: true },
    isMultisig: Boolean,
  },
  setup(props, { root }) {
    const loading = ref(false);

    async function createPlainAccount() {
      loading.value = true;
      await root.$store.dispatch('accounts/hdWallet/create');
      loading.value = false;
      props.resolve();
    }

    async function createMultisigAccount() {
      await root.$store.dispatch('modals/open', {
        name: MODAL_MULTISIG_VAULT_CREATE,
      });
      props.resolve();
    }

    return {
      PlusCircleIcon,
      loading,
      createPlainAccount,
      createMultisigAccount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/typography';

.account-create {
  .message {
    @extend %face-sans-16-medium;

    line-height: 24px;
    max-width: 280px;
    margin: 0 auto 36px;
  }
}
</style>
