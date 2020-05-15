<template>
  <div class="not-found">
    {{ $t('pages.notFound.notFound') }}
    <Button @click="$router.push('/')">
      {{ $t('pages.notFound.initialPage') }}
    </Button>
  </div>
</template>

<style lang="scss" scoped>
.not-found {
  margin: 20px auto;
  text-align: center;
}
</style>
