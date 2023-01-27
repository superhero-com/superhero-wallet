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
            <Avatar
              class="avatar"
              size="sm"
              :address="address"
            />
            <AddressTruncated
              :address="address"
              class="ae-address"
            />
            <LinkButton :to="getExplorerPath(address)">
              <ExternalLinkIcon class="external-icon" />
            </LinkButton>
          </div>
        </div>
        <div class="dialog">
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
        </div>
      </div>
    </template>
  </DetailsItem>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { useGetter } from '../../composables/vuex';
import Avatar from '../components/Avatar.vue';
import AddressTruncated from '../components/AddressTruncated.vue';
import LinkButton from '../components/LinkButton.vue';
import DetailsItem from '../components/DetailsItem.vue';
import ExternalLinkIcon from '../../icons/external-link.svg?vue-component';

export default defineComponent({
  name: 'AuthorizedAccounts',
  components: {
    DetailsItem,
    LinkButton,
    AddressTruncated,
    Avatar,
    ExternalLinkIcon,
  },
  props: {
    addressList: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    requiredConfirmations: { type: Number, required: true },
  },
  setup: () => ({ getExplorerPath: useGetter('getExplorerPath') }),
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.authorized-accounts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);

  .account-row {
    display: flex;
    align-items: center;
  }

  .avatar {
    margin-right: 4px;
  }

  .external-link {
    margin-left: 7px;
    width: 22px;
    height: 22px;
    opacity: 0.85;
  }

  .account-list,
  .dialog {
    width: 100%;
  }

  .account-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ae-address {
    color: rgba(variables.$color-white, 0.85);
    opacity: 0.85;
  }

  .dialog {
    @extend %face-sans-12-regular;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-radius: 8px;
    background-color: variables.$color-dialog;
    height: 100%;
    position: relative;
    padding: 21px 8px;
    color: rgba(variables.$color-white, 0.5);

    .count-value {
      @extend %face-sans-14-bold;

      line-height: 19px;
    }

    &::after {
      content: '';
      position: absolute;
      background-color: variables.$color-dialog;
      width: 8px;
      height: 8px;
      top: 50%;
      left: -4px;
      transform: translateY(-50%) rotate(45deg);
    }
  }
}
</style>
