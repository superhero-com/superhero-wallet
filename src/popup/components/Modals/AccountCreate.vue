<template>
  <Modal
    class="account-create"
    from-bottom
    has-close-button
    no-padding
    centered
    @close="resolve"
  >
    <div class="content-wrapper ">
      <h2 class="text-heading-1">
        {{ $t('modals.createAccount.title') }}
      </h2>

      <p class="message">
        {{ $t('modals.createAccount.msg') }}
      </p>

      <BtnSubheader
        :header="$t('common.aeternity')"
        :subheader="$t('modals.createAccount.btnAeSubtitle')"
        :icon="iconAe"
        @click="createAeAccount"
      />
      <BtnSubheader
        :header="$t('common.bitcoin')"
        :subheader="$t('modals.createAccount.btnBtcSubtitle')"
        :icon="iconBtc"
        :disabled="!isOnline"
        @click="createBtcAccount"
      />
      <!-- TODO Remove v-if, when dogecoin will supported -->
      <BtnSubheader
        v-if="false"
        :header="$t('common.dogecoin')"
        :subheader="$t('modals.createAccount.btnDogeSubtitle')"
        :icon="iconDoge"
        :disabled="!isOnline"
        @click="createDogeAccount"
      />
    </div>

    <Loader v-if="loading" />
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import {
  MODAL_AE_ACCOUNT_CREATE,
  PROTOCOL_AETERNITY,
  PROTOCOL_BITCOIN,
} from '@/constants';
import { useConnection, useModals } from '@/composables';
import { useStore } from 'vuex';
import Loader from '@/popup/components/Loader.vue';
import BtnSubheader from '../buttons/BtnSubheader.vue';
import Modal from '../Modal.vue';
import iconAe from '../../../icons/coin/aeternity.svg?vue-component';
import iconBtc from '../../../icons/coin/bitcoin.svg?vue-component';
import iconDoge from '../../../icons/coin/dogecoin.svg?vue-component';

export default defineComponent({
  components: {
    Loader,
    Modal,
    BtnSubheader,
  },
  props: {
    resolve: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const store = useStore();
    const { isOnline } = useConnection();
    const { openModal } = useModals();
    const loading = ref(false);

    async function createAeAccount() {
      await openModal(MODAL_AE_ACCOUNT_CREATE);
      props.resolve();
    }

    async function createBtcAccount() {
      loading.value = true;
      await store.dispatch('accounts/hdWallet/create', {
        isRestored: false,
        protocol: PROTOCOL_BITCOIN,
      });
      loading.value = false;
      props.resolve();
    }

    async function createDogeAccount() {
      props.resolve();
    }

    return {
      PROTOCOL_AETERNITY,
      PROTOCOL_BITCOIN,
      isOnline,
      iconAe,
      iconBtc,
      iconDoge,
      loading,
      createAeAccount,
      createBtcAccount,
      createDogeAccount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/typography';

.account-create {
  .content-wrapper {
    padding: 0 16px 32px;
  }

  .message {
    @extend %face-sans-16-medium;

    padding-inline: inherit;
    line-height: 24px;
    margin: 0 auto 36px;
  }
}
</style>
