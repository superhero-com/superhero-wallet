<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="comment-new">
        <AccountSelector
          v-model="creatorAddress"
          :options="aeAccountsSelectOptions"
          @select="setActiveAccountByAddress"
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
            {{ $t('common.cancel') }}
          </BtnMain>
          <BtnMain
            :disabled="!isTippingSupported"
            @click="sendComment"
          >
            {{ $t('common.confirm') }}
          </BtnMain>
        </FixedScreenFooter>

        <Loader v-if="loading" />
      </div>
    </ioncontent>
  </ionpage>
</template>

<script lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import {
  defineComponent,
  ref,
  watch,
} from 'vue';
import { RouteLocationNormalized, useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { PROTOCOL_AETERNITY } from '@/constants';
import { postJson } from '@/utils';
import {
  useAccounts,
  useAeSdk,
  useDeepLinkApi,
  useModals,
} from '@/composables';
import { ROUTE_ACCOUNT } from '@/popup/router/routeNames';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';

import AccountSelector from '../components/AccountSelector.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import FixedScreenFooter from '../components/FixedScreenFooter.vue';

export default defineComponent({
  name: 'CommentNew',
  components: {
    AccountSelector,
    BtnMain,
    FixedScreenFooter,
    IonPage,
    IonContent,
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const { t } = useI18n();

    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    const { getAeSdk, fetchRespondChallenge, isTippingSupported } = useAeSdk({ store });
    const { openDefaultModal } = useModals();
    const { openCallbackOrGoHome } = useDeepLinkApi({ router });
    const {
      aeAccountsSelectOptions,
      getLastActiveProtocolAccount,
      setActiveAccountByAddress,
    } = useAccounts({ store });

    const creatorAddress = ref(getLastActiveProtocolAccount(PROTOCOL_AETERNITY)!.address);
    const id = ref<string>('');
    const parentId = ref<number | undefined>(undefined);
    const text = ref<string>('');
    const loading = ref<boolean>(false);

    watch(
      () => route,
      ({ query }: RouteLocationNormalized) => {
        id.value = query.id as string ?? '';
        parentId.value = query.parentId ? +query.parentId : undefined;
        text.value = query.text as string ?? '';

        if (!id.value || !text.value) {
          router.push({ name: ROUTE_ACCOUNT });
          throw new Error('CommentNew: Invalid arguments');
        }
      },
      { immediate: true },
    );

    async function sendComment() {
      loading.value = true;

      try {
        const postToCommentApi = async (body: any) => postJson(`${aeActiveNetworkSettings.value.backendUrl}/comment/api/`, { body });

        const responseChallenge = await postToCommentApi({
          tipId: id.value,
          text: text.value,
          author: creatorAddress.value,
          parentId: parentId.value,
        });
        const respondChallenge = await fetchRespondChallenge(responseChallenge);

        postToCommentApi(respondChallenge);

        openCallbackOrGoHome(true);
      } catch (e: any) {
        openDefaultModal({
          title: t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
        e.payload = { id, parentId, text };
        throw e;
      } finally {
        loading.value = false;
      }
    }

    // Wait until the `isTippingSupported` is established by the aeSdk
    (async () => {
      loading.value = true;
      await getAeSdk();
      loading.value = false;
    })();

    return {
      creatorAddress,
      aeAccountsSelectOptions,
      id,
      parentId,
      text,
      loading,
      isTippingSupported,
      sendComment,
      openCallbackOrGoHome,
      setActiveAccountByAddress,
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
