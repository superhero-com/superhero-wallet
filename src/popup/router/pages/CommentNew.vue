<template>
  <div class="popup">
    <div class="tip-note-preview mt-15">
      {{ text }}
    </div>

    <Button @click="sendComment">
      {{ $t('pages.tipPage.confirm') }}
    </Button>
    <Button @click="cancel">
      {{ $t('pages.tipPage.cancel') }}
    </Button>

    <Loader size="big" :loading="loading" type="transparent" content="" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Backend from '../../../lib/backend';
import openUrl from '../../utils/openUrl';

export default {
  data: () => ({ id: 0, text: '', loading: false }),
  computed: {
    ...mapGetters(['sdk']),
    urlParams() {
      return new URL(this.$route.fullPath, window.location).searchParams;
    },
  },
  async created() {
    this.loading = true;
    this.id = +this.urlParams.get('id');
    this.text = this.urlParams.get('text');
    if (!this.id || !this.text) {
      this.$router.push('/account');
      throw new Error('CommentNew: Invalid arguments');
    }
    await this.$watchUntilTruly(() => this.sdk);
    this.loading = false;
  },
  methods: {
    openCallbackOrGoHome(paramName) {
      const callbackUrl = this.urlParams.get(paramName);
      if (callbackUrl) openUrl(decodeURIComponent(callbackUrl));
      else this.$router.push('/account');
    },
    async sendComment() {
      this.loading = true;
      try {
        await Backend.sendTipComment(this.id, this.text, await this.sdk.address(), async data =>
          Buffer.from(await this.sdk.signMessage(data)).toString('hex'),
        );
        this.openCallbackOrGoHome('x-success');
      } catch (e) {
        this.$logError({ e, id: this.id, text: this.text, action: 'comment' });
        this.$store.dispatch('modals/open', { name: 'default', type: 'transaction-failed' });
      } finally {
        this.loading = false;
      }
    },
    cancel() {
      this.openCallbackOrGoHome('x-cancel');
    },
  },
};
</script>
