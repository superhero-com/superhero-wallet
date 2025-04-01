<template>
  <Default
    v-bind="{ ...$attrs, resolve }"
    icon="info"
    :title="$t('modals.recipient.title')"
    :subtitle="isProtocolAe
      ? $t('modals.recipient.ae-sub-header')
      : $t('modals.recipient.sub-header', { protocolName })"
    :close="resolve"
  >
    <template #msg>
      <div class="msg">
        <p :class="{ capitalize: !isProtocolAe }">
          <i18n-t
            keypath="modals.recipient.msg.publicAddress.msg"
            tag="div"
            scope="global"
          >
            <strong
              v-if="isProtocolAe"
              class="title"
            >
              {{ $t('modals.recipient.msg.publicAddress.title') }}
            </strong>
          </i18n-t>
        </p>
        <p v-if="isProtocolAe">
          <i18n-t
            keypath="modals.recipient.msg.chain.msg"
            tag="div"
            scope="global"
            class="aens"
          >
            <strong class="title">
              {{ $t('modals.recipient.msg.chain.title') }}:
            </strong>
            {{ $t('modals.recipient.msg.chain.linkTitle') }}
          </i18n-t>
        </p>
      </div>
    </template>
    <template #footer>
      <BtnMain
        class="footer"
        extend
        @click="resolve"
      >
        {{ $t('common.ok') }}
      </BtnMain>
    </template>
  </Default>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import {
  Protocol,
  ResolveCallback,
} from '@/types';
import { PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import Default from './Default.vue';
import BtnMain from '../buttons/BtnMain.vue';

export default defineComponent({
  components: {
    Default,
    BtnMain,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    protocol: { type: String as PropType<Protocol>, required: true },
    close: { type: Function, default: null },
  },
  setup(props) {
    const isProtocolAe = computed(() => props.protocol === PROTOCOLS.aeternity);
    const protocolName = computed(
      () => ProtocolAdapterFactory.getAdapter(props.protocol).protocolName,
    );

    return {
      protocolName,
      isProtocolAe,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/share-info';
@use '@/styles/variables' as *;
@use '@/styles/typography';

.msg {
  @extend %face-sans-15-regular;

  text-align: center;
  line-height: 20px;

  .aens {
    padding: 10px;
  }

  .title {
    color: $color-white;
  }

  .capitalize::first-letter {
    text-transform: capitalize;
  }
}
</style>
