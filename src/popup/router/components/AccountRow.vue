<template>
  <div class="account-row">
    <Avatar
      size="sm"
      class="account-avatar"
      :address="account.address"
      :name="account.name"
    />
    <Truncate
      v-if="account.name"
      :str="account.name"
    />
    <span
      v-else
      data-cy="account-name"
      class="account-name"
    >
      {{ $t('pages.account.heading') }} {{ account.idx + 1 }}
    </span>

    <a
      :href="explorerUrl"
      target="_blank"
      class="account-explorer-link"
    >
      <ExternalLinkIcon />
    </a>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Avatar from './Avatar.vue';
import Truncate from './Truncate.vue';
import ExternalLinkIcon from '../../../icons/external-link.svg?vue-component';

export default {
  components: {
    Avatar,
    Truncate,
    ExternalLinkIcon,
  },
  computed: {
    ...mapGetters(['account', 'activeNetwork']),
    explorerUrl() {
      return `${this.activeNetwork.explorerUrl}/account/transactions/${this.account.address}`;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/share-info';
@use '../../../styles/mixins';

.account-row {
  @include mixins.flex(center, center, row);

  margin-top: 4px;

  .truncate {
    display: block;
  }

  .account-avatar {
    margin-right: 8px;
  }

  .account-name {
    @extend %face-sans-16-medium;

    display: inline-block;
  }

  .account-explorer-link {
    display: inline-block;
    width: 22px;
    height: 22px;
    color: inherit;

    &:hover {
      color: variables.$color-primary;
    }
  }
}
</style>
