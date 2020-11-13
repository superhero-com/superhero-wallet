<template>
  <div class="not-found">
    {{ $t('pages.notFound.notFound') }}
    <Button @click="$router.push('/')">
      {{ $t('pages.notFound.initialPage') }}
    </Button>
  </div>
</template>

<script>
import Button from '../components/Button';

export default {
  components: { Button },
};
</script>

<style lang="scss" scoped>
.not-found {
  margin: 20px auto;
  text-align: center;
}
</style>
