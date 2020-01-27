<template>
    <div class="popup">
        <div class="actions">
            <button class="backbutton toAccount" @click="navigateUtilities"><ae-icon name="back" /> {{$t('pages.fungibleTokensPage.backToUtilities') }}</button>
        </div>
        <h3>{{$t('pages.fungibleTokensPage.heading') }}</h3>
        <ae-panel>
            <h4>{{$t('pages.fungibleTokensPage.addFungToken') }}</h4>
            <hr>
            <small class="sett_info">{{$t('pages.fungibleTokensPage.tokenInfo') }}</small>
            <ae-button face="round" fill="primary" extend class="add-token" @click="navigateAddToken">{{$t('pages.fungibleTokensPage.addTokenButton') }}</ae-button>
        </ae-panel>
        <ae-panel>
            <h4>{{$t('pages.fungibleTokensPage.deployFungToken') }}</h4>
            <hr>
            <small class="sett_info">{{$t('pages.fungibleTokensPage.deployInfo') }}</small>
            <ae-button face="round" fill="primary" extend class="create-token" @click="navigateCreateToken">{{$t('pages.fungibleTokensPage.deployButton') }}</ae-button>
        </ae-panel>

        <ae-panel>
            <h4>{{$t('pages.mintTokenPage.mint') }}</h4>
            <hr>
            <small class="sett_info">{{$t('pages.mintTokenPage.mintInfo') }}</small>
            <ae-button face="round" fill="primary" extend @click="navigateMintToken">{{$t('pages.mintTokenPage.mint') }}</ae-button>
        </ae-panel>

        <ae-panel>
            <h4>{{$t('pages.utilities.allowances') }}</h4>
            <hr>
            <small class="sett_info">{{$t('pages.utilities.allowancesInfo') }}</small>
            <ae-button face="round" fill="primary" extend @click="navigateAllowencesPage">{{$t('pages.utilities.allowances') }}</ae-button>
        </ae-panel>
        
    </div>
</template>

<script>
export default {
    data() {
        return {
        }
    },
    methods:{
        navigateUtilities(){
            this.$router.push('/utilities')
        },
        navigateAllowencesPage() {
            this.$router.push('/allowances');
        },
        navigateAddToken() {
            this.$router.push('/tokens')
        },
        navigateCreateToken() {
            this.$router.push('/create-token')
        },
        navigateMintToken() {
            this.$router.push('/mint-token')
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.ae-button {
    margin-top:1rem;
}
p small {
    font-weight:normal;
}
</style>
