<template>
    <div class="popup">
        <Modal :modal="modal">
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
            </div>
        </Modal>
        <div class="actions">
            <button class="backbutton toAccount" @click="navigateToSettings"><ae-icon name="back" /> {{$t('pages.advancedSettings.backToSettings') }}</button>
        </div>
        <h3 style='text-align:center;'>{{$t('pages.advancedSettings.heading') }}</h3>
        
        <ae-panel>
            <div class="maindiv_input-group-addon">
                <h4>{{ $t('pages.advancedSettings.exportKeystore') }}</h4><hr>
                <ae-button @click="exportKeypair('keystore')" id="exportKeystore" class="notround" face="round" fill="primary">
                    <ae-icon name="save" />
                    {{ $t('pages.advancedSettings.exportKeystore') }}
                </ae-button>
            </div>
        </ae-panel>
        <ae-panel>
            <div class="maindiv_input-group-addon">
                <h4>{{ $t('pages.advancedSettings.exportKeypair') }}</h4><hr>
                <ae-button @click="exportKeypair('keypair')" id="exportKeypair" class="notround" face="round" fill="primary">
                    <ae-icon name="save" />
                    {{ $t('pages.advancedSettings.exportKeypair') }}
                </ae-button>
            </div>
        </ae-panel>

        <div v-if="loading" class="loading">
            <ae-loader />
        </div>
        <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { getHdWalletAccount } from '../../utils/hdWallet';
const {Universal} = require('@aeternity/aepp-sdk');
import { saveAs } from 'file-saver';

export default {
    data () {
        return {
            loading: false,
            password: '',
        }
    },
    computed: {
        ...mapGetters(['account', 'balance', 'network', 'current','transactions','subaccounts','wallet','activeAccountName','activeAccount', 'popup']),
    },
    methods: {
        async exportKeypair (type) {
            if(type == 'keypair') {
                browser.storage.sync.get('userAccount').then(async (user) => {
                    if(user.userAccount && user.hasOwnProperty('userAccount')) {
                        let encryptedPrivateKey = JSON.parse(user.userAccount.encryptedPrivateKey);
                        let match = await decrypt(encryptedPrivateKey.crypto.ciphertext,this.password,encryptedPrivateKey.crypto.cipher_params.nonce,encryptedPrivateKey.crypto.kdf_params.salt);
                        this.loading = false
                        if(match) {
                            this.privateKey = match
                            this.setAlertData("alternative",true,match)
                        }else {
                            this.setAlertData("primary",true,this.$t('pages.securitySettings.incorrectPassword'))
                        }
                    }
                })
            } else if(type == 'keystore') {
                let blobData = "";
                try {
                    blobData = JSON.parse(this.account.encryptedPrivateKey);
                }catch(err) {
                    blobData = JSON.stringify(this.account.encryptedPrivateKey);
                }
                let blob = new Blob([blobData], {type: "application/json;charset=utf-8"});
                saveAs(blob, "keystore.json");
            }
        },
        navigateToSettings() {
            this.$router.push('/settings')
        }
    }
}
</script>

<style lang="scss">

@import '../../../common/base';
.notround { border-radius: 0 !important; }

</style>