<template>
  <Default
    class="name-extend-confirm"
    icon="info"
    :resolve="handleConfirm"
    :close="handleCancel"
    :title="$t('modals.nameExtendConfirm.title')"
  >
    <p>{{ $t('modals.nameExtendConfirm.description') }}</p>

    <DetailsItem :label="$t('modals.nameExtendConfirm.name')">
      <span class="name">{{ name }}</span>
    </DetailsItem>

    <DetailsItem :label="$t('modals.nameExtendConfirm.cost')">
      <TokenAmount
        :amount="fee"
        :protocol="PROTOCOLS.aeternity"
        hide-fiat
        high-precision
      />
    </DetailsItem>

    <CheckBox
      v-if="!autoExtend"
      v-model="enableAutoExtend"
      class="auto-extend"
    >
      {{ $t('modals.nameExtendConfirm.autoExtend') }}
    </CheckBox>

    <template #footer>
      <BtnMain
        variant="muted"
        extra-padded
        :text="$t('common.cancel')"
        @click="handleCancel"
      />
      <BtnMain
        :text="$t('common.confirm')"
        @click="handleConfirm"
      />
    </template>
  </Default>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
} from 'vue';
import { PROTOCOLS } from '@/constants';
import { RejectedByUserError } from '@/lib/errors';
import type { RejectCallback, ResolveCallback } from '@/types';

import CheckBox from '../CheckBox.vue';
import DetailsItem from '../DetailsItem.vue';
import TokenAmount from '../TokenAmount.vue';
import BtnMain from '../buttons/BtnMain.vue';
import Default from './Default.vue';

export interface NameExtendConfirmResolveValue {
  autoExtend: boolean;
}

export default defineComponent({
  name: 'NameExtendConfirm',
  components: {
    BtnMain,
    CheckBox,
    Default,
    DetailsItem,
    TokenAmount,
  },
  props: {
    resolve: {
      type: Function as PropType<ResolveCallback<NameExtendConfirmResolveValue>>,
      required: true,
    },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    name: { type: String, required: true },
    fee: { type: Number, required: true },
    autoExtend: Boolean,
  },
  setup(props) {
    const enableAutoExtend = ref(false);

    function handleConfirm() {
      props.resolve({
        autoExtend: enableAutoExtend.value,
      });
    }

    function handleCancel() {
      props.reject(new RejectedByUserError());
    }

    return {
      enableAutoExtend,
      handleCancel,
      handleConfirm,
      PROTOCOLS,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';

.name-extend-confirm {
  p {
    @extend %face-sans-15-regular;

    margin: 0 0 16px;
  }

  .name {
    word-break: break-word;
  }

  .auto-extend {
    margin-top: 16px;
  }
}
</style>
