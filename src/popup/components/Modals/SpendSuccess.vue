<template>
  <Modal
    class="spend-success"
    has-close-button
    from-bottom
    centered
    :body-without-padding-bottom="hasPayload"
    data-cy="spend-success"
    @close="resolve"
  >
    <ModalHeader
      class="header"
      :title="$t('pages.send.title')"
      :subtitle="$t('pages.send.subtitle')"
      disable-subtitle-margin
    />
    <div class="pending-wrapper">
      <IconBoxed :icon="PendingIcon" />
    </div>
    <TokenAmount
      :amount="getTxAmountTotal(transaction)"
      :symbol="symbol"
      :hide-fiat="!isAe"
    />
    <p class="sending-to">
      {{ transaction.tipUrl ? $t('pages.send.sentTo') : $t('pages.send.sendingTo') }}
    </p>
    <div class="content">
      <span v-if="transaction.tipUrl">{{ transaction.tipUrl }}</span>
      <AvatarWithChainName
        v-else
        :address="transaction.tx.recipientId"
        :show-address="!nameRecipient"
        :hide-avatar="hideAvatar"
        :name="nameRecipient"
      />
    </div>

    <PayloadDetails
      class="payload-detail"
      :payload="payload"
    />

    <template #footer>
      <BtnMain
        class="btn-secondary"
        variant="muted"
        extend
        nowrap
        extra-padded
        :text="$t('pages.send.viewInExplorer')"
        :href="getExplorerPath(transaction.hash)"
        :icon="ExternalLinkIcon"
      />
      <BtnMain
        inline
        nowrap
        :text="$t('common.ok')"
        @click="resolve"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  onMounted,
  PropType,
} from '@vue/composition-api';
import { getPayload, AETERNITY_SYMBOL, isAensName } from '../../utils';
import { useMiddleware } from '../../../composables';
import { ITokenList, ITransaction } from '../../../types';
import { useState, useGetter } from '../../../composables/vuex';

import Modal from '../Modal.vue';
import TokenAmount from '../TokenAmount.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AvatarWithChainName from '../AvatarWithChainName.vue';
import ModalHeader from '../ModalHeader.vue';
import PayloadDetails from '../PayloadDetails.vue';

import PendingIcon from '../../../icons/animated-pending.svg?vue-component';
import ExternalLinkIcon from '../../../icons/external-link-big.svg?vue-component';
import IconBoxed from '../IconBoxed.vue';

export default defineComponent({
  components: {
    PayloadDetails,
    ModalHeader,
    AvatarWithChainName,
    Modal,
    TokenAmount,
    BtnMain,
    IconBoxed,
  },
  props: {
    resolve: { type: Function, required: true },
    transaction: { type: Object as PropType<ITransaction>, required: true },
  },
  setup(props, { root }) {
    const { getMiddleware } = useMiddleware({ store: root.$store });

    const hideAvatar = ref(false);
    const nameRecipient = ref(null);

    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const getTxAmountTotal = useGetter('getTxAmountTotal');
    const getExplorerPath = useGetter('getExplorerPath');

    const payload = computed(() => getPayload(props.transaction));
    const hasPayload = computed(() => !!payload.value?.length);
    const symbol = computed(() => {
      const { contractId } = props.transaction.tx;
      return contractId ? availableTokens.value[contractId].symbol : AETERNITY_SYMBOL;
    });
    const isAe = computed(() => symbol.value === AETERNITY_SYMBOL);

    onMounted(async () => {
      const { recipientId } = props.transaction.tx;
      if (isAensName(recipientId)) {
        const middleware = await getMiddleware();
        hideAvatar.value = true;
        nameRecipient.value = (await middleware.getNameById(recipientId)).name;
      }
    });

    return {
      PendingIcon,
      ExternalLinkIcon,
      hideAvatar,
      nameRecipient,
      symbol,
      isAe,
      payload,
      hasPayload,
      getExplorerPath,
      getTxAmountTotal,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.spend-success {
  .header {
    padding: 0;
  }

  .pending-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 34px;
    margin-bottom: 24px;
  }

  .sending-to {
    margin-bottom: 12px;
    color: rgba(variables.$color-white, 0.75);
  }

  .content {
    margin-bottom: 20px;
    padding-inline: 8px;
    width: 100%;
  }

  .payload-detail {
    margin-bottom: 10px;
  }

  .btn-secondary {
    width: 119px;
  }
}
</style>
