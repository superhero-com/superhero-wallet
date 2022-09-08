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
      />
      <div class="header">
        <Truncate :str="name" />
        <span
          v-if="nameEntry.pending"
          class="pending"
        >
          {{ $t('pages.transactions.pending') }}
        </span>
        <div
          v-if="!nameEntry.pending"
          class="buttons"
        >
          <button
            v-show="hasPointer"
            :class="{ set: account.name === name }"
            :disabled="account.name === name"
            @click="setDefault"
          >
            {{
              account.name === name
                ? $t('pages.names.list.default-name')
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
            v-show="expand || !hasPointer"
            :class="{ edit: showInput }"
            @click="expandAndShowInput"
          >
            {{ $t('pages.names.details.set-pointer') }}
          </button>
        </div>
      </div>
      <ButtonPlain @click="expand = !expand">
        <Arrow :class="['icon', { rotated: expand, hidden: nameEntry.pending }]" />
      </ButtonPlain>
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
        v-model="newPointer"
        :placeholder="$t('pages.names.details.address-placeholder')"
        :message="error ? $t('pages.names.list.valid-identifier-error') : null"
        plain
      >
        <template #right>
          <ButtonPlain
            v-show="newPointer.length"
            @click="setPointer"
          >
            <Save />
          </ButtonPlain>
          <ButtonPlain
            v-if="UNFINISHED_FEATURES"
            v-show="!newPointer.length"
            @click="insertValueFromClipboard"
          >
            <Paste />
          </ButtonPlain>
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
        <HelpButton
          slot="label"
          :title="$t('modals.name-pointers-help.title')"
          :msg="$t('modals.name-pointers-help.msg')"
        />
        <div
          v-for="(nameEntryPointer, key, idx) in nameEntry.pointers"
          slot="value"
          :key="key"
          class="pointers"
        >
          <span>{{ `#${idx + 1}` }}</span>
          {{ nameEntryPointer }}
        </div>
      </DetailsItem>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { pick } from 'lodash-es';
import { blocksToRelativeTime } from '../../../filters/toRelativeTime';
import { checkAddressOrChannel, readValueFromClipboard } from '../../utils/helper';
import Pending from '../../../icons/animated-pending.svg?vue-component';
import Avatar from './Avatar.vue';
import Truncate from './Truncate.vue';
import InputField from './InputField.vue';
import ButtonPlain from './ButtonPlain.vue';
import DetailsItem from './DetailsItem.vue';
import HelpButton from './HelpButton.vue';
import Arrow from '../../../icons/arrow.svg?vue-component';
import Save from '../../../icons/account-card/btn-save.svg?vue-component';
import Paste from '../../../icons/paste.svg?vue-component';

export default {
  components: {
    Pending, Avatar, Truncate, InputField, ButtonPlain, DetailsItem, Arrow, Save, Paste, HelpButton,
  },
  props: {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    autoExtend: { type: Boolean },
  },
  data: () => ({
    expand: false,
    newPointer: '',
    showInput: false,
    error: false,
    UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
  }),
  subscriptions() {
    return pick(this.$store.state.observables, ['topBlockHeight']);
  },
  computed: {
    ...mapGetters(['account']),
    nameEntry() {
      return this.$store.getters['names/get'](this.name);
    },
    hasPointer() {
      return this.nameEntry?.pointers?.accountPubkey;
    },
    addressOrFirstPointer() {
      return this.nameEntry?.pointers?.accountPubkey
        || Object.values(this.nameEntry?.pointers || {})[0];
    },
  },
  watch: {
    newPointer() {
      this.error = false;
    },
  },
  methods: {
    blocksToRelativeTime,
    checkAddressOrChannel,
    async insertValueFromClipboard() {
      this.newPointer = await readValueFromClipboard();
    },
    async setDefault() {
      await this.$store.dispatch('names/setDefault', {
        address: this.account.address,
        name: this.name,
      });
    },
    async setAutoExtend() {
      if (!this.autoExtend) {
        await this.$store.dispatch('modals/open', {
          name: 'confirm',
          icon: 'info',
          title: this.$t('modals.autoextend-help.title'),
          msg: this.$t('modals.autoextend-help.msg'),
        });
      }
      this.$store.commit('names/setAutoExtend', { name: this.name, value: !this.autoExtend });
    },
    expandAndShowInput() {
      this.expand = true;
      this.showInput = !this.showInput;
    },
    async setPointer() {
      if (!checkAddressOrChannel(this.newPointer)) {
        this.error = true;
        return;
      }
      this.$store.dispatch('names/updatePointer', {
        name: this.name,
        address: this.newPointer,
        type: 'update',
      });
      this.newPointer = '';
      this.showInput = false;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

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
        color: variables.$color-dark-grey;

        @extend %face-sans-12-regular;
      }

      .truncate {
        @extend %face-sans-14-bold;

        line-height: 16px;
      }

      .buttons {
        margin-top: 2px;

        button {
          padding: 2px 8px;
          cursor: pointer;
          background: variables.$color-border-hover;
          border-radius: 6px;

          @extend %face-sans-12-medium;

          &.set {
            background: rgba(255, 170, 41, 0.1);
            color: variables.$color-warning;
          }

          &.edit {
            background: rgba(17, 97, 254, 0.15);
            color: variables.$color-blue;
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

    .input-field {
      margin: 8px 0;

      ::v-deep .wrapper {
        svg + .input {
          margin-left: 4px;
        }

        .button-plain {
          width: 24px;
          height: 24px;
        }
      }
    }

    .details-item ::v-deep .value {
      color: variables.$color-light-grey;
    }

    > .details-item {
      margin: 8px 0;

      ::v-deep .value {
        @extend %face-mono-10-medium;

        .pointers {
          display: flex;

          span {
            margin-right: 4px;
            color: variables.$color-dark-grey;

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

        ::v-deep .value .secondary {
          color: variables.$color-dark-grey;
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
    color: variables.$color-light-grey;

    @extend %face-mono-10-medium;
  }
}
</style>
