<template>
  <div class="comment-new">
    <div class="tip-note-preview mt-15">
      {{ text }}
    </div>

    <Button
      :disabled="!tippingSupported"
      @click="sendComment"
    >
      {{ $t('pages.tipPage.confirm') }}
    </Button>
    <Button @click="openCallbackOrGoHome(false)">
      {{ $t('pages.tipPage.cancel') }}
    </Button>

    <Loader v-if="loading" />
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters, mapState } from 'vuex';
import Button from '../components/Button';
import deeplinkApi from '../../../mixins/deeplinkApi';

export default {
  components: { Button },
  mixins: [deeplinkApi],
  data: () => ({
    id: 0, parentId: undefined, text: '', loading: false,
  }),
  computed: {
    ...mapState(['sdk']),
    ...mapGetters(['tippingSupported']),
  },
  watch: {
    $route: {
      immediate: true,
      async handler({ query }) {
        this.loading = true;
        this.id = query.id;
        if (query.parentId) this.parentId = +query.parentId;
        this.text = query.text;
        if (!this.id || !this.text) {
          this.$router.push('/account');
          throw new Error('CommentNew: Invalid arguments');
        }
        await this.$watchUntilTruly(() => this.sdk);
        this.loading = false;
      },
    },
  },
  methods: {
    async sendComment() {
      this.loading = true;
      try {
        await this.$store.dispatch('sendTipComment', [
          this.id,
          this.text,
          await this.sdk.address(),
          this.parentId,
        ]);
        this.openCallbackOrGoHome(true);
      } catch (e) {
        this.$store.dispatch('modals/open', {
          name: 'default',
          title: this.$t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
        e.payload = pick(this, ['id', 'parentId', 'text']);
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
