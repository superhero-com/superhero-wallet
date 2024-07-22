<template>
  <DetailsItem
    :label="$t('multisig.authorizedSigners')"
    class="authorized-accounts"
  >
    <template #value>
      <div class="account-list">
        <div
          v-for="address in addressList"
          :key="address"
          class="account-row"
        >
          <AccountItem
            :address="address"
            :protocol="PROTOCOLS.aeternity"
          />
          <DialogBox
            v-if="isLocalAccountAddress(address)"
            class="dialog"
            dense
          >
            {{ $t('common.you') }}
          </DialogBox>
        </div>
      </div>
    </template>
  </DetailsItem>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { PROTOCOLS } from '@/constants';
import { useAccounts } from '../../composables';

import DetailsItem from './DetailsItem.vue';
import AccountItem from './AccountItem.vue';
import DialogBox from './DialogBox.vue';

export default defineComponent({
  name: 'AuthorizedAccounts',
  components: {
    DialogBox,
    DetailsItem,
    AccountItem,
  },
  props: {
    addressList: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  setup() {
    const { isLocalAccountAddress } = useAccounts();

    return {
      isLocalAccountAddress,
      PROTOCOLS,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.authorized-accounts {
  .account-row {
    display: flex;
    align-items: center;
  }

  .external-link {
    margin-left: 7px;
    width: 22px;
    height: 22px;
    opacity: 0.85;
  }

  .account-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    min-width: 154px;
  }

  .count-value {
    @extend %face-sans-14-medium;

    line-height: 19px;
  }

  .dialog {
    padding: 4px;
    border-radius: 4px;
    margin-left: 9px;
  }
}
</style>
