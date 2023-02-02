<template>
  <DetailsItem
    :label="$t('pages.multisigDetails.authorizedAccount')"
  >
    <template #value>
      <div class="authorized-accounts">
        <div class="account-list">
          <div
            v-for="address in addressList"
            :key="address"
            class="account-row"
          >
            <AccountItem :address="address" />
          </div>
        </div>

        <DialogBox>
          <div>
            {{ $t('pages.multisigDetails.signers') }}
            <strong class="count-value">
              {{ addressList.length }}
            </strong>
          </div>
          <div>
            {{ $t('pages.multisigDetails.approval') }}
            <strong class="count-value">
              {{ requiredConfirmations }}
            </strong>
          </div>
        </DialogBox>
      </div>
    </template>
  </DetailsItem>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import DetailsItem from './DetailsItem.vue';
import AccountItem from './AccountItem.vue';
import DialogBox from './DialogBox.vue';

export default defineComponent({
  name: 'AuthorizedAccounts',
  components: {
    DetailsItem,
    AccountItem,
    DialogBox,
  },
  props: {
    addressList: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    requiredConfirmations: { type: Number, required: true },
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.authorized-accounts {
  display: flex;
  align-items: center;
  gap: 4px;

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
    @extend %face-sans-14-bold;

    line-height: 19px;
  }
}
</style>
