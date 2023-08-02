<template>
  <div class="name-item">
    <div class="collapsed">
      <Pending
        v-if="nameEntry.pending"
        class="pending-icon"
      />
      <Avatar
        v-else
        :name="name"
        :address="address"
        borderless
      />

      <div class="header">
        <Truncate :str="name" />
        <span
          v-if="nameEntry.pending"
          class="pending"
        >
          {{ $t('common.pending') }}
        </span>
        <div
          v-else
          class="buttons"
        >
          <button
            v-show="canBeDefault"
            :class="{ set: isDefault }"
            :disabled="isDefault"
            @click="setDefault"
          >
            {{
              (isDefault)
                ? $t('pages.names.list.default')
                : $t('pages.names.list.default-make')
            }}
          </button>
          <button
            v-show="expand"
            :class="{ set: autoExtend }"
            @click="setAutoExtend"
          >
            {{ $t('pages.names.auto-extend') }}
          </button>
          <button
            v-show="expand || !canBeDefault"
            :class="{ edit: showInput }"
            @click="expandAndShowInput"
          >
            {{ $t('pages.names.details.set-pointer') }}
          </button>
          <BtnHelp
            v-if="expand && !hasPointer"
            :title="$t('modals.name-pointers-help.title')"
            :msg="$t('modals.name-pointers-help.msg')"
            small
          />
        </div>
      </div>
      <BtnPlain @click="onExpandCollapse">
        <ChevronDownIcon :class="['icon', { rotated: expand, hidden: nameEntry.pending }]" />
      </BtnPlain>
    </div>
    <span v-show="!expand && !nameEntry.pending && !!addressOrFirstPointer">
      {{ addressOrFirstPointer }}
    </span>
    <div
      v-show="expand"
      class="expand"
    >
      <InputField
        v-show="showInput"
        ref="pointerInput"
        v-model="newPointer"
        class="input-address"
        :placeholder="$t('pages.names.details.address-placeholder')"
        :message="error ? $t('pages.names.list.valid-identifier-error') : null"
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
            <span>{{ `#${idx + 1}` }}</span>
            {{ nameEntryPointer }}
          </div>
        </template>
      </DetailsItem>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { IName } from '@/types';
import { MODAL_CONFIRM } from '@/config';
import { IS_CORDOVA, IS_EXTENSION } from '@/lib/environment';
import Logger from '@/lib/logger';
import {
  blocksToRelativeTime,
  checkAddressOrChannel,
} from '../utils';
import { useAccounts, useModals, useTopHeaderData } from '../../composables';

import Avatar from './Avatar.vue';
import Truncate from './Truncate.vue';
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
    Pending,
    Avatar,
    Truncate,
    InputField,
    BtnPlain,
    BtnHelp,
    DetailsItem,
    ChevronDownIcon,
    Save,
    Paste,
  },
  props: {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    autoExtend: { type: Boolean },
  },
  setup(props) {
    const store = useStore();
    const { openModal } = useModals();
    const { activeAccount } = useAccounts({ store });
    const { t } = useI18n();
    const { topBlockHeight } = useTopHeaderData({ store });

    const expand = ref(false);
    const newPointer = ref<string>('');
    const showInput = ref(false);
    const error = ref(false);
    const pointerInput = ref();

    const nameEntry = computed<IName | null>(() => store.getters['names/get'](props.name));
    const isDefault = computed(() => activeAccount.value.name === props.name);
    const hasPointer = computed((): boolean => !!nameEntry.value?.pointers?.accountPubkey);
    const canBeDefault = computed(
      (): boolean => nameEntry.value?.pointers?.accountPubkey === activeAccount.value.address,
    );
    const addressOrFirstPointer = computed((): string | null => (
      nameEntry.value?.pointers?.accountPubkey
      || Object.values(nameEntry.value?.pointers || {})[0]
    ));

    async function readValueFromClipboard(): Promise<string | undefined> {
      if (!process.env.UNFINISHED_FEATURES) {
        return undefined;
      }
      let value = '';

      if (IS_CORDOVA) {
        value = await new Promise((...args) => window.cordova!.plugins!.clipboard.paste(...args));
      } else if (IS_EXTENSION) {
        value = await browser!.runtime.sendMessage({ method: 'paste' });
      } else {
        try {
          value = await navigator.clipboard.readText();
        } catch (e: any) {
          if (!e.message.includes('Read permission denied.')) {
            Logger.write(e);
          }
        }
      }
      return value;
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

    async function setDefault() {
      await store.dispatch('names/setDefault', {
        address: activeAccount.value.address,
        name: props.name,
      });
    }

    async function setAutoExtend() {
      if (!props.autoExtend) {
        await openModal(MODAL_CONFIRM, {
          icon: 'info',
          title: t('modals.autoextend-help.title'),
          msg: t('modals.autoextend-help.msg'),
        });
      }
      store.commit('names/setAutoExtend', { name: props.name, value: !props.autoExtend });
    }

    async function setPointer() {
      if (!checkAddressOrChannel(newPointer.value)) {
        error.value = true;
        return;
      }
      store.dispatch('names/updatePointer', {
        name: props.name,
        address: newPointer.value,
        type: 'update',
      });
      newPointer.value = '';
      showInput.value = false;
    }

    watch(newPointer, () => {
      error.value = false;
    });

    return {
      UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
      expand,
      newPointer,
      showInput,
      error,
      pointerInput,
      activeAccount,
      nameEntry,
      isDefault,
      hasPointer,
      addressOrFirstPointer,
      topBlockHeight,
      canBeDefault,
      blocksToRelativeTime,
      checkAddressOrChannel,
      insertValueFromClipboard,
      expandAndShowInput,
      onExpandCollapse,
      setDefault,
      setAutoExtend,
      setPointer,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.name-item {
  display: flex;
  flex-direction: column;
  padding: 8px var(--screen-padding-x);
  margin-left: calc(-1 * var(--screen-padding-x));
  margin-right: calc(-1 * var(--screen-padding-x));
  transition: 0.2s;

  &:hover {
    background-color: variables.$color-bg-4-hover;
  }

  .collapsed {
    display: flex;
    text-align: left;
    justify-content: space-between;

    .pending-icon {
      height: 32px;
      width: 32px;
    }

    .header {
      flex: 2;
      max-width: 260px;

      .pending {
        color: variables.$color-grey-dark;

        @extend %face-sans-12-regular;
      }

      .truncate {
        @extend %face-sans-15-medium;

        line-height: 16px;
      }

      .buttons {
        display: flex;
        margin-top: 2px;
        user-select: none;

        button:not(.btn-help) {
          @extend %face-sans-12-medium;

          padding: 2px 8px;
          cursor: pointer;
          background: variables.$color-border-hover;
          border-radius: 6px;

          @include mixins.mobile {
            padding: 2px 6px;
          }

          &.set {
            background: rgba(variables.$color-warning, 0.1);
            color: variables.$color-warning;
          }

          &.edit {
            background: rgba(variables.$color-primary, 0.15);
            color: variables.$color-primary;
          }

          &:not(:last-of-type) {
            margin-right: 4px;
          }
        }
      }
    }

    .button-plain {
      align-self: flex-start;
      flex-basis: 24px;

      .icon {
        width: 14px;
        color: variables.$color-white;
        opacity: 0.44;

        &.hidden {
          display: none;
        }

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
      color: variables.$color-grey-light;
    }

    > .details-item {
      margin: 8px 0;

      :deep(.value) {
        @extend %face-mono-10-medium;

        letter-spacing: 0;

        .pointers {
          display: flex;

          span {
            margin-right: 4px;
            color: variables.$color-grey-dark;

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
          color: variables.$color-grey-dark;
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
    color: variables.$color-grey-light;

    @extend %face-mono-10-medium;
  }
}
</style>
