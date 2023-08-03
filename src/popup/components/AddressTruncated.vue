<template>
  <div class="address-truncated">
    <div class="address-truncated-chunks">
      <span>{{ truncatedAddress[0] }}</span>
      <span class="dots">
        &middot;&middot;&middot;
      </span>
      <span>{{ truncatedAddress[1] }}</span>
    </div>

    <LinkButton
      v-if="showExplorerLink"
      :to="explorerUrl"
      target="_blank"
      class="external-link"
    >
      <ExternalLinkIcon class="external-link-icon" />
    </LinkButton>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import type { INetwork } from '@/types';
import { AeScan } from '@/protocols/aeternity/libs/AeScan';
import { truncateAddress } from '@/utils';
import { useGetter } from '@/composables/vuex';

import ExternalLinkIcon from '@/icons/external-link.svg?vue-component';
import LinkButton from './LinkButton.vue';

export default defineComponent({
  components: {
    LinkButton,
    ExternalLinkIcon,
  },
  props: {
    address: { type: String, required: true },
    showExplorerLink: Boolean,
  },
  setup(props) {
    const activeNetwork = useGetter<INetwork>('activeNetwork');

    const truncatedAddress = computed(() => truncateAddress(props.address));
    const explorerUrl = computed(() => {
      const aeScan = new AeScan(activeNetwork.value.explorerUrl);
      return aeScan.prepareUrlForAccount(props.address);
    });

    return {
      truncatedAddress,
      explorerUrl,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/typography';

.address-truncated {
  display: flex;
  align-items: center;
  user-select: none;

  &-chunks {
    @extend %face-mono-12-medium;

    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
    letter-spacing: 0.07em;

    .dots {
      @extend %face-mono-16-regular;

      letter-spacing: -0.25em;
      text-align: center;
      margin-left: -1px;
      margin-right: 3px;
    }
  }

  .external-link {
    margin-top: -1px; // Compensate alignment with text
    flex-shrink: 0;
    color: inherit;

    .external-link-icon {
      width: 22px;
      height: 22px;
    }
  }
}
</style>
