<template>
  <Card class="account-skeleton">
    <ion-skeleton-text
      class="avatar"
      animated
    />
    <div class="account-info">
      <ion-skeleton-text
        class="name"
        animated
      />
      <div class="address-and-balance">
        <ion-skeleton-text
          class="address"
          animated
        />
        <ion-skeleton-text
          v-if="showBalance"
          class="balance"
          animated
        />
      </div>
    </div>
  </Card>
</template>

<script>
import { IonSkeletonText } from '@ionic/vue';
import { defineComponent } from 'vue';

import Card from '@/popup/components/Card.vue';

export default defineComponent({
  components: {
    Card,
    IonSkeletonText,
  },
  props: {
    showBalance: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.account-skeleton {
  padding: 9px 8px;

  &:deep(.card-content) {
    display: flex;
  }

  .account-info {
    display: flex;
    flex-direction: column;
    margin-left: 8px;
    gap: 8px;
    margin-top: 4px;
    width: 100%;

    .address-and-balance {
      display: flex;
      justify-content: space-between;
    }
  }

  ion-skeleton-text {
    --background: rgba(#{$color-white-rgb}, 0.1);
    --background-rgb: #{$color-white-rgb};
    margin: 0;

    &.name {
      height: 12px;
      width: 152px;
      border-radius: 8px;
    }

    &.address {
      height: 12px;
      width: 96px;
      border-radius: 8px;
    }

    &.avatar {
      --border-radius: 25px;
      height: 40px;
      width: 40px;
    }

    &.balance {
      width: 40px;
      border-radius: 8px;
    }
  }
}
</style>
