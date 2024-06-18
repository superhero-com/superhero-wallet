<template>
  <div class="name-item">
    <div class="name-item-header">
      <AccountInfo
        :account="activeAccount"
        :custom-name="nameEntry.name"
        avatar-size="rg"
        avatar-borderless
        dense
      >
        <template #avatar>
          <Pending
            v-if="nameEntry.pending"
            class="pending-icon"
          />
        </template>

        <template #address>
          <span
            v-if="nameEntry.pending"
            class="pending"
            v-text="$t('common.pending')"
          />
          <div
            v-else
            class="buttons"
          >
            <BtnPlain
              v-show="canBeDefault"
              class="button-plain"
              :class="{ set: isDefault }"
              :disabled="isDefault"
              :text="(isDefault)
                ? $t('pages.names.list.default')
                : $t('pages.names.list.default-make')
              "
              @click="handleSetDefault"
            />
            <BtnPlain
              v-show="expand"
              class="button-plain"
              :class="{ set: nameEntry.autoExtend }"
              :text="$t('pages.names.auto-extend')"
              @click="toggleAutoExtend"
            />
            <BtnPlain
              v-show="expand || !canBeDefault"
              class="button-plain"
              :class="{ edit: showInput }"
              :text="$t('pages.names.details.set-pointer')"
              @click="expandAndShowInput"
            />
            <BtnHelp
              v-if="expand && !hasPointer"
              :title="$t('modals.name-pointers-help.title')"
              :msg="$t('modals.name-pointers-help.msg')"
              small
            />
          </div>
        </template>
      </AccountInfo>

      <BtnPlain
        v-if="!nameEntry.pending"
        class="btn-toggle"
        @click="onExpandCollapse"
      >
        <ChevronDownIcon class="icon" :class="{ rotated: expand }" />
      </BtnPlain>
    </div>

    <span v-if="!expand && !nameEntry.pending && !!addressOrFirstPointer">
      {{ addressOrFirstPointer }}
    </span>

    <Transition name="fade-transition">
      <div
        v-if="expand"
        class="expand"
      >
        <InputField
          v-show="showInput"
          ref="pointerInput"
          v-model="newPointer"
          class="input-address"
          :placeholder="$t('pages.names.details.address-placeholder')"
          :message="nameError ? $t('pages.names.list.valid-identifier-error') : null"
          code
        >
          <template #after>
            <BtnPlain
              v-show="newPointer.length"
              @click="setPointer"
            >
              <Save class="input-address-icon" />
            </BtnPlain>
            <BtnPlain
              v-if="UNFINISHED_FEATURES"
              v-show="!newPointer.length"
              @click="insertValueFromClipboard"
            >
              <Paste class="input-address-icon" />
            </BtnPlain>
          </template>
        </InputField>

        <DetailsItem
          :value="nameEntry.hash"
          :label="nameEntry.hash && $t('pages.names.list.name-hash')"
        />
        <div class="heights">
          <DetailsItem
            :value="nameEntry.createdAtHeight"
            :label="$t('pages.names.details.created-height')"
          />
          <DetailsItem
            :value="nameEntry.expiresAt"
            :label="$t('pages.names.details.expires-height')"
            :secondary="`(≈${blocksToRelativeTime(nameEntry.expiresAt - topBlockHeight)})`"
          />
        </div>
        <DetailsItem
          v-if="Object.entries(nameEntry.pointers || {}).length"
          :label="$t('pages.names.list.pointers')"
        >
          <template #label>
            <BtnHelp
              :title="$t('modals.name-pointers-help.title')"
              :msg="$t('modals.name-pointers-help.msg')"
            />
          </template>
          <template #value>
            <div
              v-for="(nameEntryPointer, key, idx) in nameEntry.pointers"
              :key="key"
              class="pointers"
            >
              <span>#{{ idx + 1 }}</span>
              {{ nameEntryPointer }}
            </div>
          </template>
        </DetailsItem>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  PropType,
  ref,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { IName, IPopupMessageData } from '@/types';
import { Clipboard } from '@capacitor/clipboard';
import {
  IS_EXTENSION,
  IS_MOBILE_APP,
  MODAL_CONFIRM,
  POPUP_METHODS,
  UNFINISHED_FEATURES,
} from '@/constants';
import Logger from '@/lib/logger';
import {
  blocksToRelativeTime,
  handleUnknownError,
  postJson,
} from '@/utils';
import {
  useAccounts,
  useAeSdk,
  useModals,
  useTopHeaderData,
} from '@/composables';
import { checkAddressOrChannel } from '@/protocols/aeternity/helpers';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';
import { UPDATE_POINTER_ACTION } from '@/protocols/aeternity/config';

import AccountInfo from './AccountInfo.vue';
import InputField from './InputField.vue';
import BtnPlain from './buttons/BtnPlain.vue';
import BtnHelp from './buttons/BtnHelp.vue';
import DetailsItem from './DetailsItem.vue';

import Pending from '../../icons/animated-pending.svg?vue-component';
import ChevronDownIcon from '../../icons/chevron-down.svg?vue-component';
import Save from '../../icons/account-card/btn-save.svg?vue-component';
import Paste from '../../icons/paste.svg?vue-component';

export default defineComponent({
  components: {
    AccountInfo,
    Pending,
    InputField,
    BtnPlain,
    BtnHelp,
    DetailsItem,
    ChevronDownIcon,
    Save,
    Paste,
  },
  props: {
    nameEntry: { type: Object as PropType<IName>, required: true },
  },
  setup(props) {
    const { openModal } = useModals();
    const { activeAccount } = useAccounts();
    const { t } = useI18n();
    const { topBlockHeight } = useTopHeaderData();
    const {
      setAutoExtend,
      updateNamePointer,
      getName,
      setDefaultName,
    } = useAeNames();
    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    const { nodeNetworkId, fetchRespondChallenge } = useAeSdk();

    const expand = ref(false);
    const newPointer = ref<string>('');
    const showInput = ref(false);
    const nameError = ref(false);
    const pointerInput = ref();

    const isDefault = computed(
      () => getName(activeAccount.value.address).value === props.nameEntry.name,
    );
    const hasPointer = computed(
      (): boolean => !!props.nameEntry.pointers?.accountPubkey,
    );
    const canBeDefault = computed(
      (): boolean => props.nameEntry?.pointers?.accountPubkey === activeAccount.value.address,
    );
    const addressOrFirstPointer = computed((): string | null => (
      props.nameEntry?.pointers?.accountPubkey
      || Object.values(props.nameEntry?.pointers || {})[0]
    ));

    async function readValueFromClipboard(): Promise<string | undefined> {
      if (!UNFINISHED_FEATURES) {
        return undefined;
      }
      let text = '';

      if (IS_MOBILE_APP) {
        const { type, value } = await Clipboard.read();
        if (type === 'string') {
          text = value;
        }
      } else if (IS_EXTENSION) {
        text = await browser!.runtime.sendMessage<IPopupMessageData>({
          method: POPUP_METHODS.paste,
        });
      } else {
        try {
          text = await navigator.clipboard.readText();
        } catch (e: any) {
          if (!e.message.includes('Read permission denied.')) {
            Logger.write(e);
          }
        }
      }
      return text;
    }

    async function insertValueFromClipboard() {
      newPointer.value = (await readValueFromClipboard()) || '';
    }

    function expandAndShowInput() {
      expand.value = true;
      showInput.value = !showInput.value;
      if (showInput.value) {
        nextTick(() => pointerInput.value.$el.getElementsByClassName('input')[0].focus());
      }
    }

    function onExpandCollapse() {
      expand.value = !expand.value;
      showInput.value = false;
    }

    async function handleSetDefault() {
      try {
        const { address } = activeAccount.value;
        const { name } = props.nameEntry;
        const url = `${aeActiveNetworkSettings.value.backendUrl}/profile/${address}`;
        const currentNetworkId = nodeNetworkId.value;

        const response = await postJson(url, {
          body: {
            preferredChainName: name,
          },
        });

        let respondChallenge;
        try {
          respondChallenge = await fetchRespondChallenge(response);
        } catch (error: any) {
          handleUnknownError(error);
          return;
        }
        await postJson(url, { body: respondChallenge });

        if (currentNetworkId !== nodeNetworkId.value) {
          return;
        }

        setDefaultName({ address, name });
      } catch (error: any) {
        handleUnknownError(error);
      }
    }

    async function toggleAutoExtend() {
      if (!props.nameEntry.autoExtend) {
        await openModal(MODAL_CONFIRM, {
          icon: 'info',
          title: t('modals.autoextend-help.title'),
          msg: t('modals.autoextend-help.msg'),
        });
      }
      setAutoExtend(props.nameEntry.name);
    }

    async function setPointer() {
      if (!checkAddressOrChannel(newPointer.value)) {
        nameError.value = true;
        return;
      }
      updateNamePointer({
        name: props.nameEntry.name,
        address: newPointer.value,
        type: UPDATE_POINTER_ACTION.update,
      });
      newPointer.value = '';
      showInput.value = false;
    }

    watch(newPointer, () => {
      nameError.value = false;
    });

    return {
      UNFINISHED_FEATURES,
      activeAccount,
      addressOrFirstPointer,
      canBeDefault,
      nameError,
      expand,
      hasPointer,
      isDefault,
      newPointer,
      pointerInput,
      showInput,
      topBlockHeight,
      blocksToRelativeTime,
      expandAndShowInput,
      handleSetDefault,
      insertValueFromClipboard,
      onExpandCollapse,
      toggleAutoExtend,
      setPointer,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.name-item {
  display: flex;
  flex-direction: column;
  padding: 8px var(--screen-padding-x);
  margin-left: calc(-1 * var(--screen-padding-x));
  margin-right: calc(-1 * var(--screen-padding-x));
  transition: 0.2s;

  &:hover {
    background-color: $color-bg-4-hover;
  }

  .name-item-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    .pending-icon {
      height: 32px;
      width: 32px;
    }

    .pending {
      @extend %face-sans-12-regular;

      color: $color-grey-dark;
    }

    .truncate {
      @extend %face-sans-15-medium;

      line-height: 16px;
    }

    .buttons {
      display: flex;
      margin-top: 2px;
      user-select: none;

      .button-plain:not(.btn-help) {
        @extend %face-sans-12-medium;

        padding: 2px 8px;
        white-space: nowrap;
        color: $color-grey-light;
        background: $color-border-hover;
        border-radius: 6px;
        opacity: 1;

        @include mixins.mobile {
          padding: 2px 6px;
        }

        &.set {
          background: rgba($color-warning, 0.1);
          color: $color-warning;
        }

        &.edit {
          background: rgba($color-primary, 0.15);
          color: $color-primary;
        }

        &:not(:last-of-type) {
          margin-right: 4px;
        }
      }
    }

    .btn-toggle {
      margin-top: 4px;
      width: 24px;
      height: 24px;

      .icon {
        width: 14px;
        color: $color-white;
        opacity: 0.44;
        transition: all 0.2s;

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }
  }

  .expand {
    display: flex;
    flex-direction: column;

    .input-address {
      margin: 8px 0;

      &-icon {
        width: 24px;
        height: 24px;
        margin: -4px 0;
      }
    }

    .details-item :deep(.value) {
      color: $color-grey-light;
    }

    > .details-item {
      :deep(.value) {
        @extend %face-mono-10-medium;

        letter-spacing: 0;

        .pointers {
          display: flex;

          span {
            margin-right: 4px;
            color: $color-grey-dark;

            @extend %face-sans-12-medium;
          }
        }
      }
    }

    .heights {
      display: flex;
      flex-direction: row;

      .details-item {
        flex: 1;

        :deep(.value .secondary) {
          color: $color-grey-dark;
          margin-left: -2px;
        }

        &:first-of-type {
          margin-right: 16px;
        }
      }
    }
  }

  > span {
    margin-top: 4px;
    color: $color-grey-light;

    @extend %face-mono-10-medium;
  }
}
</style>
