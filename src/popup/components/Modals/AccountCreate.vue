<template>
  <Modal
    class="account-create"
    from-bottom
    has-close-button
    centered
    @close="resolve"
  >
    <h2 class="text-heading-2">
      {{ $t('modals.createAccount.title') }}
    </h2>

    <p class="message">
      {{ $t('modals.createAccount.msg') }}
    </p>

    <BtnSubheader
      :header="$t('modals.createAccount.plainAccount.btnText')"
      :subheader="$t('modals.createAccount.plainAccount.btnSubtitle')"
      :icon="plusCircleIcon"
      @click="createPlainAccount()"
    />
    <BtnSubheader
      :header="$t('modals.createAccount.multisigAccount.btnText')"
      :subheader="$t('modals.createAccount.multisigAccount.btnSubtitle')"
      :icon="plusCircleIcon"
      @click="createMultisigAccount()"
    />

    <Loader v-if="loading" />
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';
import { useMultisig } from '../../../composables';
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
  },
  setup(props, { root }) {
    const { deployMultisigAccount, multisigProgress } = useMultisig({ store: root.$store });
    const plusCircleIcon = ref(PlusCircleIcon);
    const loading = ref(false);

    async function createPlainAccount() {
      loading.value = true;
      await root.$store.dispatch('accounts/hdWallet/create');
      loading.value = false;
      props.resolve();
    }

    async function createMultisigAccount() {
      loading.value = true;
      await deployMultisigAccount(2, ['ak_aWUod4pwwhGmBLF3AYEpfm3SYQtsEJBuncTkGWmW7sf2f84My', 'ak_2cWZgLBL4rRgpiCoWVwwtDCJJFiTeETprvZsshEEYDQjdKyLpK']);
      loading.value = false;
      props.resolve();
    }

    return {
      plusCircleIcon,
      loading,
      multisigProgress,
      createPlainAccount,
      createMultisigAccount,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-create {
  .message {
    max-width: 280px;
    margin: 0 auto 36px;
  }
}
</style>
