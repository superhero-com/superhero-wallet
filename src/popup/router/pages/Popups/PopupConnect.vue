<template>
  <div class="popup">
    <div class="flex identiconContainer">
      <div class="identicon">
        <img :src="faviconUrl" @error="imageError = true" v-if="!imageError" />
        <ae-identicon :address="data.host" size="base" v-if="imageError" />
        <div class="accountName">{{ data.name }}</div>
        <div class="hostname">{{ data.host }}</div>
      </div>
      <div class="separator">
        <ae-icon name="check" />
      </div>
      <div class="identicon">
        <ae-identicon :address="account.publicKey" size="base" />
        <div class="accountName">{{ activeAccountName }}</div>
      </div>
    </div>

    <h2>
      <span class="secondary-text">{{ data.host }} ({{ data.name }}) </span>
      {{ $t('pages.connectConfirm.websiteRequestconnect') }}
      <ae-identicon class="send-account-icon" :address="account.publicKey" size="s" />
      {{ activeAccountName }}
    </h2>
    <ul>
      <ae-list-item fill="neutral" class="permission-set">
        <h4>{{ $t('pages.connectConfirm.addressLabel') }}</h4>
        <p>{{ $t('pages.connectConfirm.addressRequest') }}</p>
      </ae-list-item>
      <ae-list-item fill="neutral" class="permission-set">
        <h4>{{ $t('pages.connectConfirm.transactionLabel') }}</h4>
        <p>{{ $t('pages.connectConfirm.transactionRequest') }}</p>
      </ae-list-item>
    </ul>
    <!-- <p>{{$t('pages.connectConfirm.websiteRequest') }}</p> -->
    <div class="btnFixed">
      <Button half class="reject" @click="cancel">{{ $t('pages.connectConfirm.cancelButton') }}</Button>
      <Button half @click="connect">{{ $t('pages.connectConfirm.confirmButton') }}</Button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setInterval, clearInterval } from 'timers';
import { setConnectedAepp, checkAeppConnected, setPermissionForAccount } from '../../../utils/helper';
import Button from '../../components/Button';

export default {
  components: {
    Button,
  },
  data() {
    return {
      data: {},
      imageError: false,
    };
  },
  created() {
    const waitProps = setInterval(() => {
      if (window.props) {
        this.data = window.props;
        clearInterval(waitProps);
      }
    }, 500);
  },
  methods: {
    cancel() {
      this.data.reject(false);
    },
    async connect() {
      await setPermissionForAccount(this.data.host, this.account.publicKey);
      this.data.resolve(true);
    },
  },
  computed: {
    ...mapGetters(['account', 'activeAccountName']),
    faviconUrl() {
      return typeof this.data.icons !== 'undefined' ? this.data.icons : `${this.data.protocol}//${this.data.host}/favicon.ico`;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../../common/variables';

h2 {
  word-break: break-word;
  line-height: 1.8rem;
  font-size: 1.2rem;
}
p {
  font-weight: normal;
  word-break: break-word;
  font-size: 0.9rem;
}
.accountName {
  font-size: 1rem;
}
.hostname {
  font-size: 0.8rem;
}
.identiconContainer {
  position: relative;
  margin-top: 2rem;
  &:before {
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
      height: 4rem !important;
      position: relative;
      z-index: 1;
      padding: 0 0.9rem !important;
      width: auto;
    }
  }
  .identicon:first-child:after,
  .identicon:last-child:after {
    content: '';
    width: 40%;
    border-top: 2px dashed #ccc;
    height: 1px;
    display: inline-block;
    position: absolute;
    left: 0;
    top: 2rem;
    transform: translateY(-50%);
    -ms-transform: translateY(-50%);
    -webkit-transform: translateY(-50%);
  }
  .identicon:first-child:after {
    right: 0;
    left: auto;
  }
  .identicon:last-child:after {
    left: 0;
  }
  .separator {
    margin-top: 1rem;
    padding: 0 0.7rem;
    .ae-icon {
      background: $color-alternative;
      padding: 0.5rem;
      color: #fff;
      border-radius: 50%;
    }
  }
}

.permission-set {
  flex-direction: column;
  text-align: left;

  h4 {
    display: block;
    width: 100%;
    margin: 0;
  }
  p {
    display: block;
    width: 100%;
    margin: 0;
  }
}
ul {
  padding: 0;
}
</style>
