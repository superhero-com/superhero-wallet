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
  getCurrentInstance,
  ref,
  watch,
} from 'vue';
import { RouteLocationNormalized, useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { MODAL_DEFAULT } from '../utils';
import { useDeepLinkApi, useSdk, useAccounts } from '../../composables';
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
  setup(props) {
    console.log(props);
    const instance = getCurrentInstance();
    const root = instance?.root as any;
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    const { getSdk } = useSdk({ store });
    const { openCallbackOrGoHome } = useDeepLinkApi({ router });
    const { account, accounts, accountsSelectOptions } = useAccounts({ store });

    const creatorAddress = ref<string>(account.value.address);
    const id = ref<string>('');
    const parentId = ref<number | undefined>(undefined);
    const text = ref<string>('');
    const loading = ref<boolean>(false);
    const tippingSupported = useGetter('tippingSupported');

    watch(
      () => route,
      ({ query }: RouteLocationNormalized) => {
        id.value = query.id as string ?? '';
        parentId.value = query.parentId ? +query.parentId : undefined;
        text.value = query.text as string ?? '';

        if (!id.value || !text.value) {
          router.push({ name: 'account' });
          throw new Error('CommentNew: Invalid arguments');
        }
      },
      { immediate: true },
    );

    async function sendComment() {
      loading.value = true;
      const sdk = await getSdk();
      try {
        await store.dispatch('sendTipComment', [
          id.value,
          text.value,
          await sdk.address(),
          parentId.value,
        ]);
        openCallbackOrGoHome(true);
      } catch (e: any) {
        store.dispatch('modals/open', {
          name: MODAL_DEFAULT,
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
        store.commit(
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
