<template>
  <div class="name-list-header">
    <Button third :to="{ name: 'name-list' }" :inactive="$route.name !== 'name-list'">
      {{ $t('pages.names.list.button') }}
    </Button>
    <Button third :to="{ name: 'auction-list' }" :inactive="$route.name !== 'auction-list'">
      {{ $t('pages.names.auctions.button') }}
    </Button>
    <Button third :to="{ name: 'name-claim' }" :inactive="$route.name !== 'name-claim'">
      {{ $t('pages.names.claim.button') }}
    </Button>
  </div>
</template>

<script>
import Button from './Button';

export default {
  components: { Button },
};
</script>

<style lang="scss" scoped>
.name-list-header {
  display: flex;
  margin-top: 20px;
  margin-bottom: 30px;
  justify-content: space-between;

  a.primary-button {
    line-height: 36px;
  }
}
</style>
