<template>
  <div class="popup">
    <div data-cy="names-container">
      <div class="tab-holder flex flex-justify-between">
        <Button :class="tab == 'registered' ? 'danger' : ''" @click="tab = 'registered'" third>{{
          $t('pages.namingSystemPage.yourNamesBtn')
        }}</Button>
        <Button :class="tab == 'auctions' ? 'danger' : ''" @click="tab = 'auctions'" third>{{
          $t('pages.namingSystemPage.allActiveAuctionsBtn')
        }}</Button>
        <Button :class="tab == 'claim' ? 'danger' : ''" @click="tab = 'claim'" third>{{
          $t('pages.namingSystemPage.AddNewBtn')
        }}</Button>
      </div>

      <!-- if is clicked Your Names  -->
      <div class="seeAllRegisteredNames" v-if="tab == 'registered'">
        <h4>{{ $t('pages.namingSystemPage.registeredNames') }}</h4>
        <hr />
        <ae-list v-if="registeredNames.length">
          <ae-list-item fill="neutral" v-for="(name, key) in registeredNames" :key="key">
            <UserAvatar :address="name.owner" />
            <div style="width:100%;" class="text-left ml-10">
              <div class="">{{ name.name }}</div>
              <ae-address :value="name.owner" length="flat" />
              <div v-if="name.addPointer" class="pointer-holder mt-10">
                <Input
                  size="m-0"
                  v-model="name.pointerAddress"
                  :error="name.pointerError"
                  class="pointer-input"
                  :placeholder="$t('pages.namingSystemPage.pointerPlaceholder')"
                />
                <ae-icon name="close" @click.native="name.addPointer = false" />
              </div>
              <Button
                v-if="!name.addPointer"
                class="danger"
                :disabled="!address(name)"
                @click="extend(name)"
                small
                >{{ $t('pages.namingSystemPage.extend') }}</Button
              >
              <Button
                :small="!name.addPointer"
                @click="setPointer(key)"
                :class="name.addPointer ? 'danger' : ''"
                >{{ $t('pages.namingSystemPage.pointer') }}</Button
              >
            </div>

            <ae-icon
              fill="primary"
              face="round"
              name="reload"
              class="name-pending"
              v-if="name.pending"
            />
          </ae-list-item>
        </ae-list>
        <p v-if="!names.length">{{ $t('pages.namingSystemPage.noNames') }}</p>
      </div>

      <!-- if is clicked All Active  -->
      <div class="seeAllActiveAuctions" v-if="tab == 'auctions'">
        <h4 v-if="!moreAuInfo.visible">{{ $t('pages.namingSystemPage.activeAuctions') }}</h4>
        <h4 v-if="moreAuInfo.visible">{{ $t('pages.namingSystemPage.auctionInfo') }}</h4>
        <hr />

        <ae-filter-list v-if="!moreAuInfo.visible">
          <p style="margin:0">{{ $t('pages.namingSystemPage.filtersBy') }}</p>

          <Button
            @click="filterType = 'soonest'"
            :class="filterType == 'soonest' ? 'danger' : ''"
            third
            small
            >{{ $t('pages.namingSystemPage.filterBySoonest') }}</Button
          >
          <Button
            @click="filterType = 'length'"
            :class="filterType == 'length' ? 'danger' : ''"
            third
            small
            >{{ $t('pages.namingSystemPage.filterByCharLength') }}</Button
          >
          <Button
            @click="filterType = 'bid'"
            :class="filterType == 'bid' ? 'danger' : ''"
            third
            small
            >{{ $t('pages.namingSystemPage.filterByBid') }}</Button
          >
        </ae-filter-list>

        <ae-list v-if="!moreAuInfo.visible && activeAuctions != null">
          <ae-list-item
            class="singleAuction"
            fill="neutral"
            v-for="(info, key) in auctions"
            :key="key"
            @click="moreAuctionInfo(key, info)"
          >
            <UserAvatar class="subAccountIcon" :address="info.winning_bidder" />
            <div class="auctionInfo">
              <div class="name">{{ info.name }}</div>
              <div class="expiration">Expires in {{ info.expiration }} blocks</div>
            </div>
          </ae-list-item>
        </ae-list>

        <p v-if="activeAuctions == null">{{ $t('pages.namingSystemPage.noAuctions') }}</p>

        <div v-if="moreAuInfo.visible">
          <div class="actions">
            <button class="backbutton toAccount" @click="moreAuInfo.visible = false">
              <ae-icon name="back" />{{ $t('pages.namingSystemPage.backButton') }}
            </button>
          </div>
          <div>
            <span>Expires in: </span><b>{{ moreAuInfo.info.expiration }} </b>blocks<br />
            <hr />
            <span>{{ $t('pages.namingSystemPage.currentBid') }}</span>
            <ae-list-item style="border:none" fill="neutral">
              <UserAvatar class="subAccountIcon" :address="moreAuInfo.info.winning_bidder" />
              <div class="auctionInfo">
                <div class="name">
                  {{ moreAuInfo.info.winning_bid.toFixed(3) }} {{ $t('pages.appVUE.aeid') }}
                </div>
                <div style="color:#aba9a9" class="expiration">
                  <small>{{ moreAuInfo.info.winning_bidder }}</small>
                </div>
              </div>
            </ae-list-item>
            <hr />
            <span>{{ $t('pages.namingSystemPage.previousBids') }}</span>
            <div v-if="previousBids">
              <ae-list-item
                v-for="(bid, idx) in previousBids"
                v-bind:key="idx"
                style="border:none"
                fill="neutral"
              >
                <UserAvatar class="subAccountIcon" :address="bid.accountId" />
                <div class="auctionInfo">
                  <div class="name">{{ bid.nameFee.toFixed(3) }} AE</div>
                  <div style="color:#aba9a9" class="expiration">
                    <small>{{ bid.accountId }}</small>
                  </div>
                </div>
              </ae-list-item>
            </div>
            <div v-if="!previousBids">
              <p>{{ $t('pages.namingSystemPage.noPreviousBids') }}</p>
            </div>
            <hr />
            <Button class="danger" extend @click="bidOnThisHandler(moreAuInfo)">{{
              $t('pages.namingSystemPage.goBiddingBtn')
            }}</Button>
          </div>
        </div>
      </div>

      <!-- if is clicked Add New Name  -->
      <div class="addNewName" v-if="tab == 'claim'">
        <div class="maindiv_input-group-addon">
          <h4>{{ $t('pages.namingSystemPage.registerName') }}</h4>
          <hr />
          <div class="flex flex-align-center flex-justify-content-center">
            <Input
              v-model="name"
              :placeholder="$t('pages.namingSystemPage.namePlaceholder')"
              label=".chain"
              labelPosition="right"
            />
            <Button @click="registerName" small class="danger">
              <ae-icon name="plus" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <Loader size="big" :loading="loading || sdk === null" type="transparent" content=""></Loader>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import axios from 'axios';
import { convertToAE, getAddressByNameEntry, checkAddress, chekAensName } from '../../utils/helper';
import Input from '../components/Input';
import Button from '../components/Button';
import UserAvatar from '../components/UserAvatar';

export default {
  components: {
    Input,
    Button,
    UserAvatar,
  },
  data() {
    return {
      tab: 'claim',
      loading: false,
      name: '',
      ak_address: '',
      polling: null,
      activeAuctions: null,
      moreAuInfo: {
        visible: false,
        key: null,
        info: null,
      },
      filterType: 'soonest',
      bySoonest: true,
      byCharLength: false,
      byBid: false,
      bids: null,
      namesofaddresses: null,
      registeredNames: [],
    };
  },
  computed: {
    ...mapGetters(['current', 'names', 'sdk', 'network', 'account', 'middleware']),
    auctions() {
      if (this.filterType === 'soonest') return this.activeAuctions;
      if (this.filterType === 'length')
        return this.activeAuctions.map(a => a).sort((a, b) => a.name.length - b.name.length);
      if (this.filterType === 'bid')
        return this.activeAuctions.map(a => a).sort((a, b) => a.winning_bid - b.winning_bid);
      return null;
    },
    currentBid() {
      if (!this.bids) {
        return null;
      }
      return this.bids.reduce((a, b) => (a.nameFee.isGreaterThan(b.nameFee) ? a : b));
    },
    previousBids() {
      if (!this.bids) {
        return null;
      }
      return this.bids.filter(bid => bid !== this.currentBid);
    },
  },
  watch: {
    names(names) {
      this.registeredNames = names
        ? names.map((n, i) => ({
            ...n,
            addPointer: this.registeredNames[i] ? this.registeredNames[i].addPointer : false,
            pointerAddress: this.registeredNames[i] ? this.registeredNames[i].pointerAddress : null,
            pointerError: this.registeredNames[i] ? this.registeredNames[i].pointerError : null,
          }))
        : [];
    },
  },
  created() {
    this.loading = true;
    this.polling = setInterval(async () => {
      if (!this.middleware) {
        this.loading = false;
        return;
      }
      if (this.moreAuInfo.info != null) {
        this.updateAuctionEntry();
      }
      const middleWareBaseUrl = this.network[this.current.network].middlewareUrl;
      const fetched = (await axios(`${middleWareBaseUrl}/middleware/names/auctions/active`)).data;
      this.activeAuctions = fetched;
      this.$store.dispatch('getRegisteredNames');
      this.loading = false;
    }, 3000);
  },
  methods: {
    address(name) {
      return getAddressByNameEntry(name);
    },
    async updateAuctionEntry() {
      const res = await this.$store.dispatch('fetchAuctionEntry', this.moreAuInfo.info.name);
      this.expiration = res.expiration;
      this.bids = res.bids;
    },
    bidOnThisHandler(info) {
      this.$router.push({ name: 'auction-bid', params: { auctionInfo: info } });
    },
    moreAuctionInfo(key, info) {
      this.moreAuInfo.visible = true;
      this.moreAuInfo.key = key;
      this.moreAuInfo.info = { ...info, winning_bid: convertToAE(info.winning_bid) };
    },
    async registerName() {
      this.name = this.name.trim();
      const onlyLettersAndNums = /^[A-Za-z0-9]+$/;
      if (this.name === '') {
        this.$store.dispatch('modals/open', { name: 'default', type: 'name-exist' });
      } else if (!onlyLettersAndNums.test(this.name)) {
        this.$store.dispatch('modals/open', { name: 'default', type: 'only-chars' });
      } else {
        this.loading = true;
        const name = `${this.name}.chain`;
        try {
          await this.sdk.aensQuery(name);
          this.loading = false;
          this.$store.dispatch('modals/open', { name: 'default', type: 'name-exist' });
        } catch (err) {
          const tx = {
            popup: false,
            tx: {
              name,
              recipientId: '',
            },
            type: 'namePreClaim',
          };
          this.$store.commit('SET_AEPP_POPUP', true);
          this.$router.push({
            name: 'sign',
            params: {
              data: tx,
              type: tx.type,
            },
          });
        }
      }
    },
    async redirectToConfirm(name, type = 'extend', options = {}) {
      try {
        const { id, pointers } = await this.sdk.getName(name);
        const tx = {
          popup: false,
          tx: {
            name,
            claim: { id, name, pointers },
            ...options,
          },
          type: 'nameUpdate',
          nameUpdateType: type,
        };
        this.$store.commit('SET_AEPP_POPUP', true);
        this.$router.push({
          name: 'sign',
          params: {
            data: tx,
            type: tx.type,
          },
        });
      } catch (e) {
        this.$store.dispatch('modals/open', { name: 'default', type: 'transaction-failed' });
      }
    },
    async extend({ name }) {
      await this.redirectToConfirm(name);
    },
    async setPointer(key) {
      const name = this.registeredNames[key];
      if (!name.addPointer) {
        name.addPointer = true;
      } else {
        name.pointerError =
          !chekAensName(name.pointerAddress) && !checkAddress(name.pointerAddress);
        if (name.pointerError) return;
        let pointer = name.pointerAddress;
        if (chekAensName(name.pointerAddress)) {
          try {
            const nameObject = await this.sdk.aensQuery(name.pointerAddress);
            const address = getAddressByNameEntry(nameObject);
            if (!address) {
              name.pointerError = true;
              return;
            }
            pointer = address;
          } catch (e) {
            name.pointerError = true;
            return;
          }
        }
        await this.redirectToConfirm(name.name, 'updatePointer', { pointers: [pointer] });
      }
    },
  },
  beforeDestroy() {
    window.clearTimeout(this.polling);
  },
};
</script>

<style lang="scss" scoped>
.ae-identicon.base {
  width: 2rem;
}
.seeAllActiveAuctions li {
  margin-bottom: 5px;
  .auctionInfo {
    width: 100%;
    text-align: left;
    .name {
      font-weight: bold;
    }
  }
}
.tab-holder {
  margin: 2rem auto;
}
.au-filter {
  cursor: pointer;
}
.ae-list .ae-list-item:first-child {
  border-top: none !important;
}
.ae-address.flat {
  font-size: 12px;
}
.pointer-holder {
  display: flex;
  justify-content: space-between;
  .pointer-input {
    width: 90%;
  }
}
</style>
