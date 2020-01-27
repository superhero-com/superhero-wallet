<template>
    <div class="popup">
        <div class="actions">
            <button class="backbutton toAccount" @click="navigateUtilities"><ae-icon name="back" /> {{$t('pages.fungibleTokensPage.backToUtilities') }}</button>
        </div>
        <h3>{{$t('pages.tokenMigration.heading') }}</h3>

        <ae-panel>
            <h4>{{$t('pages.tokenMigration.migrations') }}</h4>
            <hr>
            <div class="balance">{{ migratedBalance }}</div>
            <small class="sett_info">{{$t('pages.tokenMigration.migrationsInfo') }}</small>
            <br>
            <ae-button face="round" fill="primary" extend class="create-token" @click="seeMigrations">{{$t('pages.tokenMigration.seeMigrations') }}</ae-button>
        </ae-panel>
        
        <ae-panel>
            <h4>{{$t('pages.tokenMigration.migrateToken') }}</h4>
            <hr>
            <small class="sett_info">{{$t('pages.tokenMigration.migrateTokenInfo') }}</small>
            <br>
            <ae-button face="round" fill="primary" extend  @click="navigateMigrateToken">{{$t('pages.tokenMigration.migrateToken') }}</ae-button>
        </ae-panel>

    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { MIGRATION_STATUS_URL, MIGRATION_PHASE, MAGNITUDE } from '../../utils/constants';
import BigNumber from 'bignumber.js';

export default {
    data() {
        return {
            migratedBalance:'0'
        }
    },
    computed:{  
        ...mapGetters(['account'])
    },
    async mounted() {
        const response = await fetch(MIGRATION_STATUS_URL.replace('ADDRESS', this.account.publicKey));
        const json = await response.json();
        this.migratedBalance = json
        .filter(i => i.deliveryPeriod > MIGRATION_PHASE)
        .reduce((r, item) => r.plus(item.value), BigNumber(0)).shiftedBy(-MAGNITUDE).toFormat();
    },
    methods:{
        navigateMigrateToken() {
            this.$router.push('/token-migration')
        },
        navigateUtilities() {
            this.$router.push('/utilities')
        },
        seeMigrations() {
            browser.tabs.create({url: `https://token-migration.aepps.com/#/status/result/${this.account.publicKey}`, active: true});
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.balance{
    font-size: 3rem;
    color: #000;
}
.balance:after{
    font-size:1.5rem;
    content:'AE'
}
</style>
