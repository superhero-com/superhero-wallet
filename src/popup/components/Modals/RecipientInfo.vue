<template>
  <Default
    v-bind="{ ...$attrs, resolve }"
    icon="help"
    :title="$t('modals.recipient.title')"
    :close="resolve"
    full-screen
  >
    <template #msg>
      <div class="msg">
        <span class="sub-header">
          {{ isProtocolAe
            ? $t('modals.recipient.ae-sub-header')
            : $t('modals.recipient.sub-header', { protocolName })
          }}
        </span>
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
          >
            <strong class="title">
              {{ $t('modals.recipient.msg.chain.title') }}:
            </strong>
            {{ $t('modals.recipient.msg.chain.linkTitle') }}
          </i18n-t>
        </p>
        <p v-if="UNFINISHED_FEATURES && isProtocolAe">
          <i18n-t
            keypath="modals.readMore.msg"
            class="help"
            scope="global"
          >
            <a :href="AE_BLOG_CLAIM_TIP_URL">
              {{ $t('modals.readMore.linkTitle') }}
            </a>
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
import { AE_BLOG_CLAIM_TIP_URL } from '@/protocols/aeternity/config';
import { PROTOCOL_AETERNITY, UNFINISHED_FEATURES } from '@/constants';
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
    const isProtocolAe = computed(() => props.protocol === PROTOCOL_AETERNITY);
    const protocolName = computed(
      () => ProtocolAdapterFactory.getAdapter(props.protocol).protocolName,
    );

    return {
      AE_BLOG_CLAIM_TIP_URL,
      UNFINISHED_FEATURES,
      protocolName,
      isProtocolAe,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/share-info';
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.msg {
  @extend %face-sans-14-regular;

  text-align: left;
  line-height: 20px;

  .sub-header {
    @extend %face-sans-16-medium;

    @include mixins.flex(center, center);

    text-align: center;
    margin-bottom: 20px;
  }

  .title {
    color: variables.$color-white;
  }

  .capitalize::first-letter {
    text-transform: capitalize;
  }
}
</style>
