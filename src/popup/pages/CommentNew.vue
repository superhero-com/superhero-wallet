<template>
  <div class="comment-new">
    <AccountSelector
      v-model="creatorAddress"
      @select="selectAccount"
    />
    <div class="comment-text">
      {{ text }}
    </div>

    <FixedScreenFooter>
      <BtnMain
        variant="muted"
        extra-padded
        class="cancel-button"
        @click="openCallbackOrGoHome(false)"
      >
        {{ $t('pages.tipPage.cancel') }}
      </BtnMain>
      <BtnMain
        :disabled="!tippingSupported"
        @click="sendComment"
      >
        {{ $t('pages.tipPage.confirm') }}
      </BtnMain>
    </FixedScreenFooter>

    <Loader v-if="loading" />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  watch,
} from '@vue/composition-api';
import { Route } from 'vue-router';
import {
  useAccounts,
  useDeepLinkApi,
  useModals,
  useSdk,
} from '../../composables';
import { useGetter } from '../../composables/vuex';

import AccountSelector from '../components/AccountSelector.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import FixedScreenFooter from '../components/FixedScreenFooter.vue';

export default defineComponent({
  name: 'CommentNew',
  components: {
    AccountSelector,
    BtnMain,
    FixedScreenFooter,
  },
  setup(props, { root }) {
    const { getSdk } = useSdk({ store: root.$store });
    const { openDefaultModal } = useModals();
    const { openCallbackOrGoHome } = useDeepLinkApi({ router: root.$router });
    const { account, accounts, accountsSelectOptions } = useAccounts({ store: root.$store });

    const creatorAddress = ref<string>(account.value.address);
    const id = ref<string>('');
    const parentId = ref<number | undefined>(undefined);
    const text = ref<string>('');
    const loading = ref<boolean>(false);
    const tippingSupported = useGetter('tippingSupported');

    watch(
      () => root.$route,
      ({ query }: Route) => {
        id.value = query.id as string ?? '';
        parentId.value = query.parentId ? +query.parentId : undefined;
        text.value = query.text as string ?? '';

        if (!id.value || !text.value) {
          root.$router.push({ name: 'account' });
          throw new Error('CommentNew: Invalid arguments');
        }
      },
      { immediate: true },
    );

    async function sendComment() {
      loading.value = true;
      const sdk = await getSdk();
      try {
        await root.$store.dispatch('sendTipComment', [
          id.value,
          text.value,
          await sdk.address(),
          parentId.value,
        ]);
        openCallbackOrGoHome(true);
      } catch (e: any) {
        openDefaultModal({
          title: root.$t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
        e.payload = { id, parentId, text };
        throw e;
      } finally {
        loading.value = false;
      }
    }

    function selectAccount(val: string) {
      if (val) {
        root.$store.commit(
          'accounts/setActiveIdx',
          accounts.value.find(({ address }) => address === val)?.idx,
        );
      }
    }

    // Wait until the `tippingSupported` is established by the SDK
    (async () => {
      loading.value = true;
      await getSdk();
      loading.value = false;
    })();

    return {
      accountsSelectOptions,
      creatorAddress,
      id,
      parentId,
      text,
      loading,
      tippingSupported,
      sendComment,
      openCallbackOrGoHome,
      selectAccount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/typography';
@use '../../styles/variables' as *;

.comment-new {
  padding: 16px;

  .comment-text {
    @extend %face-sans-14-regular;

    background-color: $color-bg-6;
    padding: 8px 12px;
    border-radius: 10px;
    margin: 24px 8px 0 8px;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      visibility: visible;
      top: -16px;
      left: 0;
      border: 16px solid transparent;
      transform: rotate(-90deg);
      border-top: 16px solid $color-bg-6;
    }
  }

  .fixed-screen-footer {
    padding-inline: 0;
    margin-top: 8px;
  }

  .cancel-button {
    flex: 0;
  }
}
</style>
