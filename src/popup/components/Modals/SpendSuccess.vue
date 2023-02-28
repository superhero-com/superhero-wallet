<template>
  <Modal
    class="spend-success"
    has-close-button
    from-bottom
    centered
    :body-without-padding-bottom="hasPayload"
    data-cy="spend-success"
    @close="closeModal()"
  >
    <ModalHeader
      class="header"
      :title="$t('pages.send.title')"
      :subtitle="$t('pages.send.subtitle')"
      disable-subtitle-margin
    />
    <div class="pending-wrapper">
      <Pending />
    </div>
    <TokenAmount
      :amount="getTxAmountTotal(transaction)"
      :symbol="getTxSymbol(transaction)"
      :hide-fiat="!isAe"
    />
    <span class="sending-to">
      {{ transaction.tipUrl ? $t('pages.send.sentTo') : $t('pages.send.sendingTo') }}
    </span>
    <div
      class="content"
      :class="{ 'without-margin': hasPayload }"
    >
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
        :icon="ExternalLink"
      />
      <BtnMain
        inline
        nowrap
        :text="$t('ok')"
        @click="closeModal()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  ref,
  defineComponent,
  PropType,
  onMounted,
} from '@vue/composition-api';
import { useFungibleTokens } from '../../../composables';
import Modal from '../Modal.vue';
import TokenAmount from '../TokenAmount.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AvatarWithChainName from '../AvatarWithChainName.vue';
import ModalHeader from '../ModalHeader.vue';
import PayloadDetails from '../PayloadDetails.vue';
import {
  AETERNITY_SYMBOL,
  getPayload,
  isAensName,
  watchUntilTruthy,
} from '../../utils';
import Pending from '../../../icons/animated-pending.svg?vue-component';
import ExternalLink from '../../../icons/external-link-big.svg?vue-component';
import { useGetter, useState } from '../../../composables/vuex';
import type { ITransaction } from '../../../types';

export default defineComponent({
  components: {
    PayloadDetails,
    ModalHeader,
    AvatarWithChainName,
    Modal,
    Pending,
    TokenAmount,
    BtnMain,
  },
  props: {
    resolve: { type: Function as PropType<() => void>, required: true },
    transaction: { type: Object as PropType<ITransaction>, required: true },
  },
  setup(props, { root }) {
    const {
      getTxAmountTotal,
      getTxSymbol,
      loadTokenBalances,
    } = useFungibleTokens({
      store: root.$store,
      accountAddress: props.transaction.tx.callerId,
    });
    const middleware = useState('middleware');
    const getExplorerPath = useGetter('getExplorerPath');
    const getPreferred = useGetter('names/getPreferred');

    const hideAvatar = ref<boolean>(false);
    const nameRecipient = ref<string>();

    const isAe = computed((): boolean => (
      getTxSymbol(props.transaction) === AETERNITY_SYMBOL
    ));

    const payload = computed(() => getPayload(props.transaction));
    const hasPayload = computed((): boolean => payload.value?.length);

    function closeModal() {
      loadTokenBalances();
      props.resolve();
    }

    onMounted(async () => {
      const { recipientId } = props.transaction.tx;
      await watchUntilTruthy(() => middleware.value);
      if (recipientId && isAensName(recipientId)) {
        hideAvatar.value = true;
        nameRecipient.value = (await middleware.value.getNameById(recipientId)).name;
      }
    });

    return {
      getTxAmountTotal,
      getTxSymbol,
      getExplorerPath,
      getPreferred,
      isAe,
      hideAvatar,
      nameRecipient,
      payload,
      hasPayload,
      ExternalLink,
      closeModal,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.spend-success {
  ::v-deep .container .body {
    @include mixins.flex(flex-start, center, column);
  }

  ::v-deep .token-amount {
    @extend %face-sans-15-medium;

    .symbol {
      margin-left: 4px;
      color: rgba(variables.$color-white, 0.75);
    }

    .fiat {
      font-weight: normal;
    }
  }

  .header {
    padding: 0;
  }

  .avatar-with-chain-name {
    padding-inline: 8px;
  }

  .pending-wrapper {
    @include mixins.flex(center, center, column);

    background-color: variables.$color-bg-1;
    border: 4px solid rgba(variables.$color-white, 0.05);
    border-radius: 50%;
    margin-top: 34px;
    margin-bottom: 24px;
  }

  .animated-pending {
    width: 48px;
    height: 48px;
  }

  .sending-to {
    margin-bottom: 12px;
    color: rgba(variables.$color-white, 0.75);
  }

  .content {
    margin-bottom: 26px;
    width: 100%;

    &.without-margin {
      margin-bottom: 0;
    }
  }

  .payload-detail {
    margin-top: 20px;
    margin-bottom: 10px;
  }

  .btn-secondary {
    width: 119px;
  }
}
</style>
