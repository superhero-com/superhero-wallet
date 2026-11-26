<template>
  <Modal
    show
    full-screen
    class="network-switch"
    data-cy="popup-aex2"
    @close="cancel"
  >
    <h2 class="text-heading-4 text-center">
      {{ $t('pages.popupNetworkSwitch.title') }}
    </h2>
    <p class="text-center">
      {{ $t('pages.popupNetworkSwitch.request') }}
    </p>

    <DetailsItem
      :label="$t('pages.popupNetworkSwitch.origin')"
      :warning="isUnknownDapp"
      data-cy="aepp"
    >
      <span class="detail-value">{{ request?.app?.href || $t('common.unknown') }}</span>
    </DetailsItem>
    <InfoBox
      v-if="request?.isNewNetwork"
      type="warning"
      data-cy="new-network-warning"
      :text="$t('pages.network.thirdPartyDetails')"
    />
    <DetailsItem
      v-if="request?.networkName"
      :label="$t('pages.network.networkNameLabel')"
      :value="request.networkName"
      data-cy="network-name"
    />
    <DetailsItem
      v-if="request?.networkId"
      :label="$t('pages.popupNetworkSwitch.networkId')"
      data-cy="network-id"
    >
      <span class="detail-value">{{ request.networkId }}</span>
    </DetailsItem>
    <DetailsItem
      v-if="request?.nodeUrl"
      :label="$t('pages.network.networkUrlLabel')"
      data-cy="node-url"
    >
      <span class="detail-value">{{ request.nodeUrl }}</span>
    </DetailsItem>

    <template #footer>
      <BtnMain
        variant="muted"
        data-cy="deny"
        extra-padded
        :text="$t('common.cancel')"
        @click="cancel"
      />
      <BtnMain
        data-cy="accept"
        :disabled="isConfirmBlocked"
        :text="$t('pages.popupNetworkSwitch.confirm')"
        @click="confirm"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, onUnmounted } from 'vue';
import { RejectedByUserError } from '@/lib/errors';
import { usePopupProps } from '@/composables';
import { useConfirmGuard } from '@/composables/confirmGuard';

import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import InfoBox from '@/popup/components/InfoBox.vue';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    DetailsItem,
    InfoBox,
  },
  setup() {
    const { isConfirmBlocked } = useConfirmGuard();
    const {
      popupProps,
      setPopupProps,
    } = usePopupProps();
    const request = popupProps.value;
    const isUnknownDapp = !request?.app?.href;
    let settled = false;

    function confirm() {
      if (isConfirmBlocked.value || settled) return;
      settled = true;
      request?.resolve();
    }

    function cancel() {
      if (settled) return;
      settled = true;
      request?.reject(new RejectedByUserError());
    }

    onUnmounted(() => {
      cancel();
      if (popupProps.value === request) setPopupProps(null);
    });

    return {
      isConfirmBlocked,
      request,
      isUnknownDapp,
      confirm,
      cancel,
    };
  },
});
</script>

<style lang="scss" scoped>
.network-switch {
  .detail-value {
    overflow-wrap: anywhere;
  }
}
</style>
