<template>
  <div class="account-card-syncing">
    <PendingIcon class="pending-icon" />
    <span class="message">
      {{ $t('modals.creatingMultisigAccount.syncing') }}
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import PendingIcon from '../../icons/animated-pending.svg?vue-component';

export default defineComponent({
  components: {
    PendingIcon,
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';
@use '../../styles/mixins';

.account-card-syncing {
  @include mixins.flex(flex-start, center, row);

  color: $color-white;

  .pending-icon {
    height: 16px;
    width: 16px;
    margin-right: 4px;
  }

  .message {
    @extend %face-sans-14-medium;

    opacity: 0.85;
  }
}
</style>
