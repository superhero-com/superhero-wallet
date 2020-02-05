<template>
  <div>
    <div class="actions flex flex-align-center">
      <button class="back-button" @click="redirect"><ae-icon name="left-more" class="back-icon" /></button>
      <h3><slot></slot></h3>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    to: String,
  },
  methods: {
    redirect() {
      this.$router.push(this.to);
    },
  },
};
</script>

<style scoped>
.back-icon {
  transform: rotate(180deg);
  -ms-transform: rotate(180deg);
  -webkit-transform: rotate(180deg);
  font-size: 3rem;
}
.back-button {
  padding: 0;
}
h3 {
  margin: 0;
  margin-top: -4px;
}
</style>
