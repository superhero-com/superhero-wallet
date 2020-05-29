<template>
  <div>
    <!--eslint-disable-next-line vue-i18n/no-raw-text-->
    <p>{{ $t('options.text') }}<a href="superhero.com">Superhero.com</a></p>
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
