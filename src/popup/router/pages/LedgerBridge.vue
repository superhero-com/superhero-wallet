<!--eslint-disable-next-line vue/valid-template-root-->
<template />

<script>
export default {
  async mounted() {
    window.addEventListener('message', async (e) => {
      if (e && e.data && e.data.target === 'LEDGER-IFRAME') {
        const { action, params } = e.data;
        const replyAction = `${action}-reply`;
        try {
          window.parent.postMessage({
            action: replyAction,
            success: true,
            payload: await this.$store.dispatch('accounts/ledger/request', {
              name: action,
              args: params,
            }),
          }, '*');
        } catch (err) {
          window.parent.postMessage({
            action: replyAction,
            success: false,
            payload: JSON.stringify(err),
          }, '*');
        }
      }
    });
  },
};
</script>
