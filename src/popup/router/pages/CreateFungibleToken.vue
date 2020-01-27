<template>
    <div class="popup">
        <div class="actions">
            <button class="backbutton toAccount" @click="navigateFungibleTokens"><ae-icon name="back" /> {{$t('pages.createFungibleToken.backToFungibleTokens') }}</button>
        </div>
        <h3>{{$t('pages.createFungibleToken.heading') }}</h3>
        <ae-panel>
            <h4>{{$t('pages.createFungibleToken.heading') }}</h4>
            <hr>
            <div>
                <div class="input-container token-name-holder">
                    <ae-input :label="$t('pages.createFungibleToken.tokenName') " >
                        <input type="text" class="ae-input token-name" v-model="token.name" slot-scope="{ context }" @focus="context.focus = true" @blur="context.focus = false" />
                        <ae-toolbar slot="footer" v-if="err.name">
                            Enter token name
                        </ae-toolbar>
                    </ae-input>
                </div>
                <div class="input-container token-symbol-holder">
                    <ae-input :label="$t('pages.createFungibleToken.tokenSymbolLabel') ">
                        <input type="text" class="ae-input token-symbol" v-model="token.symbol" slot-scope="{ context }" @focus="context.focus = true" @blur="context.focus = false" />
                        <ae-toolbar slot="footer" v-if="err.symbol">
                            Invalid token symbol value
                        </ae-toolbar>
                    </ae-input>
                </div>
                <div class="input-container token-precision-holder">
                    <ae-input :label="$t('pages.createFungibleToken.initialSupply') " >
                        <input class="ae-input token-initialSupply" v-model.number="token.initialSupply" slot-scope="{ context }" @focus="context.focus = true" @blur="context.focus = false" />
                        <ae-toolbar slot="footer" v-if="err.initialSupply">
                            Invalid initial supply
                        </ae-toolbar>
                    </ae-input>
                </div>
                <div v-if="showPrecision" class="input-container token-precision-holder">
                    <ae-input :label="$t('pages.createFungibleToken.tokenPrecision') " >
                        <input type="number" min="0" max="36" step="1" class="ae-input token-precision" v-model.number="token.precision" slot-scope="{ context }" @focus="context.focus = true" @blur="context.focus = false" />
                        <ae-toolbar slot="footer" v-if="err.precision">
                            Invalid token precision
                        </ae-toolbar>
                    </ae-input>
                </div>
                <div style="border-radius:4px" class="input-container token-action-holder">
                    <div class="custom-ae-input-header">
                        <label class="custom-ae-input-label"> Token extensions </label>
                    </div>
                    <div v-for="(name, value) in extensions" v-bind:key="name">
                        <ae-check v-model="tokenExtensions" :data-val="value" :value="name" class="tokenExtensions">
                            {{name}}
                        </ae-check>
                    </div>
                    <div v-if="err.swappableWithoutBurnable" style="background: rgb(224, 224, 224);width: 100%;text-align: left;font-size: 0.6875rem;text-transform: uppercase;padding: 10px 1rem;color: #ff0d6a;font-family: 'Inter UI', sans-serif;letter-spacing: 0.2em;font-weight: bold;">
                        Attention! Swappable requires burnable!
                    </div>
                </div>
                <ae-check class="tokenRegistry" v-model="tokenRegistry">
                    {{$t('pages.createFungibleToken.registryFee') }}
                </ae-check>
                <button class="advancedbtn-precision" title="Change the token precision" @click="showPrecision = !showPrecision">Advanced</button>
                <ae-button face="round" fill="primary" @click="confirmTx" class="confirmTx" extend >{{$t('pages.createFungibleToken.deployTokenContract') }}</ae-button>
            </div>
        </ae-panel>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { isInt } from '../../utils/helper'
import { FUNGIBLE_TOKEN_CONTRACT, MIN_SPEND_TX_FEE, MAX_REASONABLE_FEE, TX_TYPES } from '../../utils/constants';
import { empty } from 'rxjs';
import * as aeternityTokens from 'aeternity-tokens';

export default {
    data() {
        return {
            token: {
                name:'',
                precision: 18,
                symbol:'',
                initialSupply: undefined,
            },
            tokenExtensions: [],
            tokenRegistry:false,
            showPrecision:false,
            extensions: [
                'allowances',
                'swappable',
                'burnable',
                'mintable'
            ],
            err:{
                name:false,
                symbol:false,
                precision:false,
                initialSupply: false,
                tokenExtensions: false,
                swappableWithoutBurnable: false,
            },
        }
    },
    computed: {
        ...mapGetters(['sdk','account','balance','wallet','tokens'])
    },
    async created() {
    },
    methods: {
        navigateFungibleTokens() {
            this.$router.push('/fungible-tokens')
        },
        confirmTx() {
            this.resetErr()
            if(this.token.name == '') {
                this.err.name = true 
                return
            }
            if(this.token.symbol == '' || (this.token.symbol != '' && this.token.symbol.length > 12)) {
                this.err.symbol = true 
                return
            }
            if(this.token.precision < 0 || this.token.precision > 36 || !isInt(this.token.precision)) {
                this.err.precision = true
                return
            }
            if(this.token.initialSupply == undefined || this.token.initialSupply < 0 || !isInt(this.token.initialSupply)) {
                this.err.initialSupply = true
                return
            }
            if(this.tokenExtensions.length == 0) {
                this.tokenExtensions = ["burnable", "mintable", "swappable", "allowances"];
            }
            if (this.tokenExtensions.includes('swappable') && !this.tokenExtensions.includes('burnable')) {
                this.err.swappableWithoutBurnable = true
                return
            }
            let contractInitArgs = []
            for(let param in this.token) {
                contractInitArgs.push(this.token[param])
            }
            var source = aeternityTokens.newToken(this.tokenExtensions);
            let tx = {
                popup:false,
                tx: {
                    amount:0,
                    recipientId:'',
                    init:contractInitArgs,
                    contractType: 'fungibleToken',
                    tokenRegistry: this.tokenRegistry,
                    source: source
                },
                type:'contractCreate'
            }
            this.$store.commit('SET_AEPP_POPUP',true)
            this.$router.push({'name':'sign', params: {
                data:tx
            }});
        },
        resetErr() {
            this.err.name = false
            this.err.symbol = false
            this.err.precision = false
            this.err.initialSupply = false
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.advancedbtn-precision {
    padding: 0.5rem;
    margin-bottom: 1rem;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.08125em;
    font-size: 12px;
    float: right;
    background: transparent;
    color: #ff0d6a;
    border-bottom: 1px solid transparent;
}
.advancedbtn-precision:hover {
    cursor: pointer;
    border-bottom: 1px solid #ff0d6a;
}
</style>
