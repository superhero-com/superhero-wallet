<template>
  <div class="seed-phrase-settings">
    <div class="title">
      {{ $t('pages.seed-phrase-settings.verifyYourSeedPhrase') }}
    </div>
    <div class="description">
      {{ $t('pages.seed-phrase-settings.confirm-that-you-save-your-seed-phrase') }}
    </div>
    <i18n
      path="pages.seed-phrase-settings.compose-your-seed-phrase"
      tag="div"
      class="description"
    >
      <span class="white-text">
        {{ $t('pages.seed-phrase-settings.in-correct-order') }}
      </span>
    </i18n>
    <ae-phraser>
      <ae-badge
        v-for="(word, index) in mnemonicShuffled"
        :key="index"
        :class="{ selected: selectedWordIds.includes(index) }"
        @click.native="onSelectWord(index)"
      >
        {{ word }}
      </ae-badge>
    </ae-phraser>

    <ae-phraser class="custom">
      <template v-if="!selectedWordIds.length">
        <ae-badge class="selected">
          <div>{{ $t('pages.seedPhrase.first') }}</div>
          <Close />
        </ae-badge>
        <ae-badge class="selected">
          <div>{{ $t('pages.seedPhrase.second') }}</div>
          <Close />
        </ae-badge>
        <ae-badge class="selected">
          <div>...</div>
          <Close />
        </ae-badge>
      </template>
      <template v-else>
        <ae-badge
          v-for="(id, index) in selectedWordIds"
          :key="id"
          @click.native="selectedWordIds.splice(index, 1)"
        >
          {{ mnemonicShuffled[id] }} <ae-icon name="close" />
        </ae-badge>
      </template>
    </ae-phraser>
    <div class="footer">
      <Button
        class="verify-button"
        :disabled="!selectedWordIds || selectedWordIds.length !== mnemonicShuffled.length"
        @click="verifyLastStep"
      >
        {{ $t('pages.seedPhrase.verify') }}
      </Button>

      <div
        v-if="showNotification"
        :class="['notification', { error: hasError }]"
      >
        <div class="icon-wrapper">
          <Alert v-if="hasError" />
          <CheckCircle v-else />
        </div>
        <div class="text">
          <div v-if="hasError">
            {{ $t('pages.seed-phrase-settings.seed-phrase-incorrect') }}
          </div>
          <div v-else>
            {{ $t('pages.seed-phrase-settings.seed-phrase-correct') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { shuffle } from 'lodash-es';
import Button from '../components/Button.vue';
import CheckCircle from '../../../icons/check-circle.svg?vue-component';
import Alert from '../../../icons/alert.svg?vue-component';
import Close from '../../../icons/close.svg?vue-component';

export default {
  components: {
    Button,
    CheckCircle,
    Alert,
    Close,
  },
  data: () => ({
    selectedWordIds: [],
    showNotification: false,
    hasError: false,
  }),
  computed: mapState({
    mnemonic: 'mnemonic',
    mnemonicShuffled: ({ mnemonic }) => shuffle(mnemonic.split(' ')),
  }),
  watch: {
    selectedWordIds() {
      this.showNotification = false;
      this.hasError = false;
    },
  },
  methods: {
    verifyLastStep() {
      const mnemonicSelected = this.selectedWordIds
        .map((idx) => this.mnemonicShuffled[idx])
        .join(' ');
      this.showNotification = true;
      this.hasError = this.mnemonic !== mnemonicSelected;
      if (this.mnemonic === mnemonicSelected) {
        this.$store.commit('setBackedUpSeed');
      }

      setTimeout(() => {
        this.showNotification = false;
      }, 3000);
    },
    onSelectWord(index) {
      if (!this.selectedWordIds.includes(index)) {
        this.selectedWordIds.push(index);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.seed-phrase-settings {
  padding: 16px;

  .title {
    color: rgba(variables.$color-white, 1);
    padding: 12px 0;
    text-align: center;

    @extend %face-sans-18-regular;
  }

  .description {
    color: rgba(variables.$color-white, 0.75);
    line-height: 20px;
    text-align: center;
    padding-bottom: 8px;

    .white-text {
      color: variables.$color-white;
    }

    @extend %face-sans-14-light;
  }

  .ae-phraser {
    margin: 18px 0 0;
    padding: 0;

    .ae-badge {
      user-select: unset;
      cursor: pointer;
      border: 1px solid rgba(variables.$color-white, 0.44);
      background-color: variables.$color-black;
      border-radius: 4px;
      color: variables.$color-white;
      padding: 4px 6px;
      height: auto;

      .ae-icon-close {
        margin-left: 5px;
      }

      &.selected {
        opacity: 0.4;
        cursor: unset;
        background: transparent;
        border-color: variables.$color-light-grey;
        color: variables.$color-white;
      }
    }

    &.custom {
      background: rgba(variables.$color-white, 0.15);
      border: 2px solid rgba(variables.$color-white, 0.1);
      border-radius: 16px;
      padding: 12px 8px;
      min-height: 176px;

      .ae-badge {
        background: rgba(variables.$color-black, 0.25);
        border-radius: 4px;
        border: none;

        .ae-icon {
          color: rgba(variables.$color-white, 0.44);
          font-size: 24px;
        }

        &.selected {
          display: inline-flex;
          align-items: center;
        }

        .icon {
          width: 24px;
          height: 24px;
        }
      }
    }
  }

  .footer {
    position: relative;

    .verify-button {
      width: 100%;
      border-radius: variables.$border-radius-interactive;
      margin-top: 30px;
    }

    .notification {
      min-height: 176px;
      border: 2px solid variables.$color-green-dark;
      border-radius: 16px;
      background: rgba(variables.$color-black, 0.85);
      position: absolute;
      bottom: 60px;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: variables.$color-green-dark;

      @extend %face-sans-16-medium;

      &.error {
        border-color: variables.$color-red-2;
        color: variables.$color-red-2;
      }

      .text {
        padding: 16px;
        text-align: center;
      }

      .icon-wrapper {
        width: 40px;
        height: 40px;
        background: rgba(variables.$color-black, 0.3);
        border-radius: 20px;

        .icon {
          width: 40px;
          height: 40px;
        }
      }
    }
  }
}
</style>
