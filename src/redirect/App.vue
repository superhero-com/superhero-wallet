<template>
  <div>
    <div id="info">
      <Logo class="logo" />
      <div class="loader" v-if="!error"></div>
      <p v-if="!error">{{ $t('redirecting') }}</p>
      <p v-if="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import Logo from '../icons/logo.svg?vue-component';

export default {
  name: 'App',
  components: {
    Logo,
  },
  data() {
    return {
      error: null,
    };
  },
  created() {
    const url = new URL(window.location.href);
    const error = url.searchParams.get('error');
    if (error) this.error = error;
  },
};
</script>

<style lang="scss">
body,
html {
  background: #16161d;
}

#info {
  position: absolute;
  top: 50%;
  left: 50%;
  -ms-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  -webkit-transform: translate(-50%, -50%);
  text-align: center;
  color: #fff;

  .logo {
    margin-bottom: 25px;
  }

  p {
    font-size: 20px;
  }

  .loader {
    border: 8px solid #f3f3f3; /* Light grey */
    border-top: 8px solid #ccc; /* Blue */
    border-radius: 50%;
    width: 70px;
    height: 70px;
    animation: spin 2s linear infinite;
    margin: 0 auto;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
}
</style>
