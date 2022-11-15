<template>
  <div class="not-found">
    {{ $t('pages.notFound.notFound') }}
    <BtnMain :to="{ name: 'index' }">
      {{ $t('pages.notFound.initialPage') }}
    </BtnMain>
  </div>
</template>

<script>
import BtnMain from '../components/buttons/BtnMain.vue';

export default {
  components: { BtnMain },
};
</script>

<style lang="scss" scoped>
.not-found {
  margin: 20px auto;
  text-align: center;
}
</style>
