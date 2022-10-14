export default {
  computed: {
    callbackOrigin() {
      return new URL(this.$route.query['x-success']).origin;
    },
  },
  methods: {
    openCallbackOrGoHome(isSuccess, templateParams = {}) {
      const callbackUrlTemplate = this.$route.query[isSuccess ? 'x-success' : 'x-cancel'];
      if (!callbackUrlTemplate) {
        this.$router.push('/account');
        return;
      }
      const callbackUrl = Object.entries(templateParams).reduce(
        (url, [key, value]) => url.replace(new RegExp(`{${key}}`, 'g'), encodeURIComponent(value)),
        this.$route.query[isSuccess ? 'x-success' : 'x-cancel'],
      );
      this.$router.push('/account');
      window.open(`${callbackUrl.includes('://') ? '' : 'http://'}${callbackUrl}`, '_blank');
    },
  },
};
