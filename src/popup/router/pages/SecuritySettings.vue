<template>
    <div class="popup">
        <div class="actions">
            <button class="backbutton toAccount" @click="navigateToSettings"><ae-icon name="back" /> {{$t('pages.securitySettings.backToSettings')}}</button>
        </div>
        <h3 style='text-align:center;'>{{$t('pages.securitySettings.heading')}}</h3>
        <ae-panel>
            <div class="maindiv_input-group-addon">
                <h4>{{$t('pages.securitySettings.privacyDataHeading')}}</h4><hr>
                <small class="sett_info">{{$t('pages.securitySettings.privacyDataSmall')}}</small>
                <ae-button face="round" fill="primary" class="notround settingBtn" extend @click="clearPrivacyConfirm">{{$t('pages.securitySettings.privacyDataClearBtn')}}</ae-button>
            </div>
        </ae-panel>
        <ae-panel class="decryptKey">
            <div class="maindiv_input-group-addon">
                <h4>{{$t('pages.securitySettings.privateKeyHeading')}}</h4><hr>
                <small class="sett_info">{{$t('pages.securitySettings.privateKeySmall')}}</small>
                <ae-button face="round" fill="primary" class="notround settingBtn" extend @click="revealPrivateKey">{{$t('pages.securitySettings.privateKeyRevealBtn')}}</ae-button>
            </div>
        </ae-panel>
        <ae-panel>
            <div class="maindiv_input-group-addon">
                <h4>{{$t('pages.securitySettings.seedRecoveryHeading')}}</h4><hr>
                <small class="sett_info">{{$t('pages.securitySettings.seedRecoverySmall')}}</small>
                <ae-button face="round" fill="primary" class="notround settingBtn" extend @click="seedPhraseRecovery">{{$t('pages.securitySettings.seedRecoveryBtn')}}</ae-button>
            </div>
        </ae-panel>
        <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
        <div v-if="loading" class="loading">
            <ae-loader />
        </div>
        <Modal v-if="type == 2" :modal="modal">
            <div slot="content">
                <small v-if="privateKey == '' && !loading && type == '2'">{{$t('pages.securitySettings.privateKeyWarning')}}</small>
                <h3 v-if="privateKey != '' && type == '2'">{{$t('pages.securitySettings.privateKey')}}</h3>
                <Alert :fill="alert.fill" :show="alert.show && !loading">
                    <div slot="content">
                        {{alert.content}}
                    </div>
                </Alert>
                <ae-toolbar fill="alternative" v-if="privateKey != ''" align="right">
                    <ae-button face="toolbar" v-clipboard:copy="privateKey" @click="reset(privateKey)">
                        <ae-icon name="copy" />
                        {{$t('pages.securitySettings.copy')}}
                    </ae-button>
                </ae-toolbar>
                <div v-if="privateKey == '' && !loading">
                    <ae-input class="my-2" label="Password">
                        <input type="password" class="ae-input"  placeholder="Enter password" v-model="password" slot-scope="{ context }" @focus="context.focus = true" @blur="context.focus = false" />
                    </ae-input>
                    <ae-button class="notround decrypt-btn" extend face="round" fill="primary" @click="decryptKeystore">{{$t('pages.securitySettings.showPrivateKey')}}</ae-button>
                </div>
                <Loader :loading="loading" size="small" :content="$t('pages.securitySettings.decryptingPrivateKey')"></Loader>
                <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
            </div>
        </Modal>
        <Modal v-if="type == 3" :modal="modal">
            <div slot="content">
                <small v-if="seedPhrase == '' && !loading && type == '3'">{{$t('pages.securitySettings.seedPhraseWarning')}}</small>
                <h3 v-if="seedPhrase != '' && type == '3'">{{$t('pages.securitySettings.seedPhrase')}}</h3>
                <Alert :fill="alert.fill" :show="alert.show && !loading">
                    <div slot="content">
                        {{alert.content}}
                    </div>
                </Alert>
                <ae-toolbar fill="alternative" v-if="seedPhrase != ''" align="right">
                    <ae-button face="toolbar" v-clipboard:copy="seedPhrase" @click="reset(seedPhrase)">
                        <ae-icon name="copy" />
                        {{$t('pages.securitySettings.copy')}}
                    </ae-button>
                </ae-toolbar>
                <div v-if="seedPhrase == '' && !loading">
                    <ae-input class="my-2" label="Password">
                        <input type="password" class="ae-input"  placeholder="Enter password" v-model="password" slot-scope="{ context }" @focus="context.focus = true" @blur="context.focus = false" />
                    </ae-input>
                    <ae-button class="notround decrypt-btn" extend face="round" fill="primary" @click="decryptKeystore">{{$t('pages.securitySettings.showSeedPhrase')}}</ae-button>
                </div>
                <Loader :loading="loading" size="small" :content="$t('pages.securitySettings.decryptingPrivateKey')"></Loader>
                <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
            </div>
        </Modal>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { getHdWalletAccount } from '../../utils/hdWallet';
import { decrypt } from '../../utils/keystore';
import { addressGenerator, decryptMnemonic } from '../../utils/address-generator';

export default {
    data () {
        return {
            loading: false,
            onoff: false,
            modal:{
                visible:false,
                title:''
            },
            password:'',
            privateKey:'',
            seedPhrase: '',
            alert: {
                fill:"neutral",
                show:false,
                content:""
            },
            loading:false,
            type: ''
        }
    },
    computed: {
        ...mapGetters(['account', 'balance', 'network', 'current','transactions','subaccounts','wallet','activeAccountName','activeAccount','popup']),
    },
    created() {
    },
    methods: {
        navigateToSettings() {
            this.$router.push('/settings')
        },
        clearPrivacyConfirm() {
            this.$store.dispatch('popupAlert', {
                name: 'account',
                type: 'confirm_privacy_clear'
            });
        },
        clearPrivacyData( ) {
            this.type = '1';
            browser.storage.local.remove('connectedAepps')
        },
        revealPrivateKey() {
            this.type = '2';
            this.modal.visible = true
            this.modal.title = this.$t('pages.securitySettings.showPrivateKey')
            this.reset()
        },
        seedPhraseRecovery() {
            this.type = '3';
            this.modal.visible = true
            this.modal.title = this.$t('pages.securitySettings.showSeedPhrase')
            this.reset()
        },
        decryptKeystore() {
            if (this.type == '3') {
                this.loading = true
                browser.storage.local.get('userAccount').then(async (user) => {
                    if(user.userAccount && user.hasOwnProperty('userAccount')) {
                        let encryptedPrivateKey = JSON.parse(user.userAccount.encryptedPrivateKey);
                        let match = await addressGenerator.decryptKeystore(encryptedPrivateKey, this.password)
                        this.loading = false
                        if(match) {
                            browser.storage.local.get('encryptedSeed').then(async (res) => {
                                if (res.encryptedSeed && res.hasOwnProperty('encryptedSeed')) {
                                    // let decryptedSeed = cryptr.decrypt(res.encryptedSeed);
                                    let decryptedSeed = await decryptMnemonic(res.encryptedSeed, this.password);
                                    this.seedPhrase = decryptedSeed;
                                    this.setAlertData("alternative",true,decryptedSeed)
                                } else {
                                    this.$store.dispatch('popupAlert', { name: 'account', type: 'reveal_seed_phrase_impossible'});
                                }
                            });
                        }else {
                            this.setAlertData("primary",true,this.$t('pages.securitySettings.incorrectPassword'))
                        }
                    }
                })
            } else if (this.type == '2') {
                this.loading = true
                browser.storage.local.get('userAccount').then(async (user) => {
                    if(user.userAccount && user.hasOwnProperty('userAccount')) {
                        let encryptedPrivateKey = JSON.parse(user.userAccount.encryptedPrivateKey);
                        let match = await addressGenerator.decryptKeystore(encryptedPrivateKey, this.password)
                        this.loading = false
                        if(match) {
                            this.privateKey = match
                            this.setAlertData("alternative",true,match)
                        }else {
                            this.setAlertData("primary",true,this.$t('pages.securitySettings.incorrectPassword'))
                        }
                    }
                })
            }
        },
        reset(privateKey = '') {
            if(privateKey == '') {
                this.resetFields()
            }else {
                this.$copyText(privateKey).then(e => {
                    this.resetFields()
                })
            }
        },
        reset(seedPhrase = '') {
            if(seedPhrase == '') {
                this.resetFields()
            }else {
                this.$copyText(seedPhrase).then(e => {
                    this.resetFields()
                })
            }
        },
        resetFields() {
            this.privateKey = ''
            this.seedPhrase = ''
            this.alert.show = false
            this.alert.content = ''
            this.password = ''
        },
        setAlertData(fill,show,content) {
            this.alert.fill = fill
            this.alert.show = show
            this.alert.content = content
        }
    }
}
</script>

<style lang="scss">

@import '../../../common/base';
.regbtn{
    background: #FF0D6A;
    color: #ffffff;
    float: right;
    width: 19%;
    border-radius: 0 !important;
}
.maindiv_input-group-addon {
    text-align: center;
}
.maindiv_input-group-addon h4 {
    text-align: left;
    margin: 0 !important; 
}
.input-group-addon {
    background: #ececec;
    border: 1px solid #ccc;
    width: 79%;
    height: 56px;
    float: left;
}
.addon-input {
    width: 75%;
    outline: none;
    color: #828282;
    padding: 0;
    height: 55px;
    text-indent: 5px;
    caret-color: #ff0d6a;
}
.addon-lbl {
    font-weight: 600;
    color: #828282;
}
input:active,input:focus {
    border: none;
    outline: none;
}
.notround { border-radius: 0 !important; }
small {
    word-break: break-word;
}
</style>