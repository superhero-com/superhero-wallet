<template>
  <div class="not-found">
    Requested page can't be found
    <Button @click="$router.push('/')">
      Open initial page
    </Button>
  </div>
</template>

<style lang="scss" scoped>
.not-found {
  margin: 20px auto;
  text-align: center;
}
</style>
