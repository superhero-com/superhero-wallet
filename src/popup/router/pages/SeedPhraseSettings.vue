<template>
  <div class="seed-phrase-settings">
    <template v-if="view === 'warning'">
      <i18n
        path="pages.seed-phrase-settings.seedRecoverySmall"
        tag="div"
        class="description"
      >
        <span>
          {{ $t('pages.seed-phrase-settings.seedRecoverySmallBackItUp') }}
        </span>
      </i18n>
      <Button
        class="show"
        @click="view = 'show'"
      >
        {{ $t('pages.seed-phrase-settings.seedRecoveryBtn') }}
      </Button>
    </template>

    <template v-else-if="view === 'show'">
      <h3>{{ $t('pages.seed-phrase-settings.seedPhrase') }}</h3>
      <ae-panel class="mnemonics">
        <p>{{ mnemonic }}</p>
        <ae-button
          v-clipboard:copy="mnemonic"
          face="toolbar"
        >
          <ae-icon name="copy" />
          {{ $t('pages.seed-phrase-settings.copy') }}
        </ae-button>
      </ae-panel>
      {{ $t('pages.seedPhrase.backupText') }}
      <p>{{ $t('pages.seedPhrase.dontLose') }}</p>
      <small>{{ $t('pages.seedPhrase.nextScreen') }}</small>
      <Button @click="view = 'verify'">
        {{ $t('pages.seedPhrase.verifySeed') }}
      </Button>
      <Button @click="setBackedUpSeed">
        {{ $t('pages.seedPhrase.doneThis') }}
      </Button>
    </template>

    <template v-else-if="view === 'verify'">
      <h3>{{ $t('pages.seedPhrase.confirmSeedPhrase') }}</h3>
      <ae-phraser>
        <ae-badge
          v-for="(word, index) in mnemonicShuffled"
          :key="index"
          :class="{ selected: selectedWordIds.includes(index) }"
          @click.native="!selectedWordIds.includes(index) && selectedWordIds.push(index)"
        >
          {{ word }}
        </ae-badge>
      </ae-phraser>
      {{ $t('pages.seedPhrase.recoveryPhrase') }}
      <ae-phraser :error="error">
        <template v-if="selectedWordIds.length === 0">
          <ae-badge class="selected">
            {{ $t('pages.seedPhrase.first') }}
          </ae-badge>
          <ae-badge class="selected">
            {{ $t('pages.seedPhrase.second') }}
          </ae-badge>
          <ae-badge class="selected">
            {{ $t('pages.seedPhrase.third') }}
          </ae-badge>
          <ae-badge class="selected">
            ...
          </ae-badge>
        </template>
        <ae-badge
          v-for="(id, index) in selectedWordIds"
          v-else
          :key="id"
          @click.native="selectedWordIds.splice(index, 1)"
        >
          {{ mnemonicShuffled[id] }} <ae-icon name="close" />
        </ae-badge>
      </ae-phraser>
      <Button @click="verifyLastStep">
        {{ $t('pages.seedPhrase.verify') }}
      </Button>
    </template>

    <template v-else-if="view === 'verified'">
      <ae-icon name="check" />
      <p>{{ $t('pages.seedPhrase.seedConfirmed') }}</p>
      <Button @click="setBackedUpSeed">
        {{ $t('pages.seedPhrase.toDashboard') }}
      </Button>
    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { shuffle } from 'lodash-es';
import Button from '../components/Button.vue';

export default {
  components: { Button },
  data: () => ({
    view: 'warning',
    selectedWordIds: [],
    error: false,
  }),
  computed: mapState({
    mnemonic: 'mnemonic',
    mnemonicShuffled: ({ mnemonic }) => shuffle(mnemonic.split(' ')),
  }),
  watch: {
    selectedWordIds() {
      this.error = false;
    },
  },
  methods: {
    setBackedUpSeed() {
      this.$store.commit('setBackedUpSeed');
      this.$router.push({ name: 'settings' });
    },
    verifyLastStep() {
      const mnemonicSelected = this.selectedWordIds
        .map((idx) => this.mnemonicShuffled[idx])
        .join(' ');
      if (this.mnemonic !== mnemonicSelected) {
        this.error = 'Oops! Incorrect seed phrase!';
        return;
      }
      this.error = false;
      this.view = 'verified';
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.seed-phrase-settings {
  padding: 16px;

  .description {
    color: rgba(variables.$color-white, 0.75);
    line-height: 20px;
    white-space: pre-line;

    span {
      color: variables.$color-white;
    }

    @extend %face-sans-14-light;
  }

  .mnemonics {
    margin: 1.5rem 0;
    margin: 0;

    p {
      word-spacing: 10px;
    }

    .ae-button {
      border-radius: 8px;
      height: 52px;
      padding: 0 2.5rem;
      float: right;
      margin: 10px 0 30px 0;
    }

    p,
    .ae-button.toolbar {
      color: variables.$color-bg-3;
    }
  }

  .button {
    width: 100%;

    &.show {
      margin-top: 48px;
    }
  }

  .ae-phraser {
    margin: 8px 0;
  }

  .ae-icon.ae-icon-check {
    color: #e911ff;
    font-size: 100px;
  }

  .ae-badge {
    user-select: unset;
    cursor: pointer;
    border: 2px solid variables.$color-light-grey;

    .ae-icon-close {
      margin-left: 5px;
    }

    &.selected {
      opacity: 0.4;
      cursor: unset;
      background: transparent;
      border: 2px solid variables.$color-light-grey;
      color: variables.$color-white;
    }
  }
}
</style>
