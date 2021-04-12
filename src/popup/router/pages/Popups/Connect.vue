<template>
  <div
    class="connect popup-aex2"
    data-cy="popup-aex2"
  >
    <div class="flex identicon-container">
      <div class="identicon">
        <img
          v-if="!imageError"
          :src="faviconUrl"
          @error="imageError = true"
        >
        <ae-identicon
          v-if="imageError"
          :address="app.host || ''"
          size="base"
        />
        <div
          class="account-name"
          data-cy="name"
        >
          {{ app.name }}
        </div>
        <div
          class="hostname"
          data-cy="host"
        >
          {{ app.host }}
        </div>
      </div>
      <div class="separator">
        <ae-icon name="check" />
      </div>
      <div class="identicon">
        <Avatar
          :address="account.address"
          :name="account.name"
          size="lg"
        />
        <div class="account-name">
          {{ account.name || account.localName }}
        </div>
      </div>
    </div>

    <h2>
      <span
        class="secondary-text"
        data-cy="aepp"
      >{{ app.host }} ({{ app.name }})</span>
      {{ $t('pages.connectConfirm.websiteRequestconnect') }}
      <Avatar
        class="send-account-icon"
        :address="account.address"
        :name="account.name"
      />
      {{ account.name || account.localName }}
    </h2>
    <ul>
      <ae-list-item
        fill="neutral"
        class="permission-set"
      >
        <h4>{{ $t('pages.connectConfirm.addressLabel') }}</h4>
        <p>{{ $t('pages.connectConfirm.addressRequest') }}</p>
      </ae-list-item>
      <ae-list-item
        fill="neutral"
        class="permission-set"
      >
        <h4>{{ $t('pages.connectConfirm.transactionLabel') }}</h4>
        <p>{{ $t('pages.connectConfirm.transactionRequest') }}</p>
      </ae-list-item>
    </ul>
    <div class="button-fixed">
      <Button
        half
        dark
        data-cy="deny"
        @click="cancel"
      >
        {{ $t('pages.connectConfirm.cancelButton') }}
      </Button>
      <Button
        half
        data-cy="accept"
        @click="resolve()"
      >
        {{ $t('pages.connectConfirm.confirmButton') }}
      </Button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import mixin from './mixin';

export default {
  components: {
    Button,
    Avatar,
  },
  mixins: [mixin],
  data: () => ({
    imageError: false,
  }),
  computed: mapGetters(['account']),
};
</script>

<style lang="scss" scoped>
@import '../../../../styles/variables';

.connect .identicon-container {
  position: relative;
  margin-top: 2rem;

  &::before {
    content: '';
  }

  .identicon {
    width: 50%;
    position: relative;
    z-index: 0;

    img {
      height: 4rem;
      position: relative;
      z-index: 1;
    }

    .ae-identicon {
      height: 4rem;
      position: relative;
      z-index: 1;
      width: auto;
      border: 0.125rem solid transparent;
      -webkit-box-shadow: 0 0 0 2px $secondary-color;
      box-shadow: 0 0 0 2px $secondary-color;
    }
  }

  .identicon:first-child::after,
  .identicon:last-child::after {
    content: '';
    width: 40%;
    border-top: 2px dashed $white-color;
    height: 1px;
    display: inline-block;
    position: absolute;
    left: 0;
    top: 2rem;
    transform: translateY(-50%);
    -ms-transform: translateY(-50%);
    -webkit-transform: translateY(-50%);
  }

  .identicon:first-child::after {
    right: 0;
    left: auto;
  }

  .identicon:last-child::after {
    left: 0;
  }

  .separator {
    margin-top: 1rem;
    padding: 0 0.7rem;

    .ae-icon {
      background: $accent-color;
      padding: 0.5rem;
      color: $white-color;
      border-radius: 50%;
    }
  }
}
</style>
<style lang="scss" src="./AexPopup.scss" scoped />
