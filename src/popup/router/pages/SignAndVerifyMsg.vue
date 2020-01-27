<template>
    <div class="popup">
        <ae-modal-light class="signature-modal" v-if="modalVisible && !requirePass" @close="modalVisible = false" :title="$t('pages.signAndVerifyMsg.signatureTitle')" >
            <h3 class="h3-signature">{{$t('pages.signAndVerifyMsg.signedMessage')}}</h3>
            <p class="signedmsg-modal">{{signature}}</p>
            <div class="signature-modal-buttons">
                <button class="copySignature signMsg-copy" @click="doCopy"><ae-icon name="copy" /> {{$t('pages.signAndVerifyMsg.copyBtn')}}</button>
                <button class="signMsg-cancel" @click="modalVisible = false" >{{$t('pages.signAndVerifyMsg.cancelBtn')}}</button>
            </div>
        </ae-modal-light>
        <ae-modal-light class="signature-modal" v-if="requirePass" @close="requirePass = false" title="" >
            <h3 class="h3-signature">{{$t('pages.signAndVerifyMsg.enterPassword')}}</h3>
            <p class="error">{{passwordAlert}}</p>
            <ae-input class="my-2" :label="$t('pages.signAndVerifyMsg.password')">
                <input type="password" class="ae-input" :placeholder="$t('pages.signAndVerifyMsg.enterPassword')" v-model="password" slot-scope="{ context }" @focus="context.focus = true" @blur="context.focus = false" />
            </ae-input>
            <div class="signature-modal-buttons">
                <button class="signMsg-copy openSignPage" @click="openSignPage">{{$t('pages.signAndVerifyMsg.signMessage')}}</button>
                <button class="signMsg-cancel" @click="requirePass = false" >{{$t('pages.signAndVerifyMsg.cancelBtn')}}</button>
            </div>
        </ae-modal-light>
        <div v-if="page == ''">
            <div class="actions">
                <button class="backbutton toAccount" @click="navigateUtilities"><ae-icon name="back" />{{ $t('pages.signAndVerifyMsg.backToUtilities') }}</button>
            </div>
            <h3>{{$t('pages.signAndVerifyMsg.signAndVerify')}}</h3>
            <ae-panel>
                <h4>{{$t('pages.signAndVerifyMsg.signMessage')}}</h4>
                <hr>
                <small class="sett_info">{{$t('pages.signAndVerifyMsg.signMessageinfo')}}</small>
                <ae-button class="signPage" face="round" extend fill="primary" @click="requirePasswordModal">{{$t('pages.signAndVerifyMsg.signBtn')}}</ae-button>
            </ae-panel>
            <ae-panel>
                <h4>{{$t('pages.signAndVerifyMsg.verifyMessage')}}</h4>
                <hr>
                <small class="sett_info">{{$t('pages.signAndVerifyMsg.verifyMessageinfo')}}</small>
                <ae-button class="verifyPage" face="round" extend fill="primary" @click="page='verify'; verifyMessage=''">{{$t('pages.signAndVerifyMsg.verifyBtn')}}</ae-button>
            </ae-panel>
        </div>
        <div v-if="page=='sign'">
            <div class="actions">
                <button class="backbutton toAccount" @click="page = ''"><ae-icon name="back" />{{ $t('pages.signAndVerifyMsg.backToSignVerifyMsg') }}</button>
            </div>
            <h4>{{ $t('pages.signAndVerifyMsg.signMessage') }}</h4>
            <hr>
            <ae-textarea v-model="signMessage" monospace :placeholder="$t('pages.signAndVerifyMsg.message')" />
            <p :class="alert.class"><small>{{alert.msg}}</small></p>
            <ae-button face="round" fill="primary" extend :class="[ signMessage.length > 0 ? '' : 'disabled' ]" @click="signMessageAction">{{$t('pages.signAndVerifyMsg.signBtn')}}</ae-button>
        </div>
        <div v-if="page=='verify'">
            <div class="actions">
                <button class="backbutton toAccount" @click="page = ''"><ae-icon name="back" />{{ $t('pages.signAndVerifyMsg.backToSignVerifyMsg') }}</button>
            </div>
            <h4>{{$t('pages.signAndVerifyMsg.verifyMessage')}}</h4>
            <hr>
            <ae-textarea v-model="verifyMessage" monospace :placeholder="$t('pages.signAndVerifyMsg.message')" />
            <p :class="alert.class"><small>{{alert.msg}}</small></p>
            <ae-button face="round" fill="primary" extend :class="[ verifyMessage.length > 0 ? '' : 'disabled' ]" @click="verifyMessageAction">{{$t('pages.signAndVerifyMsg.verifyBtn')}}</ae-button>
        </div>
        <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
        <Loader size="small" :loading="loading" v-bind="{'content':''}"></Loader>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { Crypto } from '@aeternity/aepp-sdk/es';
import Ae from '@aeternity/aepp-sdk/es/ae/universal';
import { decrypt, str2buf } from '../../utils/keystore';
import { getHdWalletAccount, generateHdWallet } from '../../utils/hdWallet';
import { addressGenerator } from '../../utils/address-generator';

export default {
    data() {
        return {
            loading: false,
            page: '',
            signMessage: '',
            verifyMessage: '',
            modalVisible: '',
            signature: '',
            password:'',
            passwordAlert: '',
            alert: {
                msg: '',
                class: '',
            },
            requirePass: false
        }
    },
    computed: {
        ...mapGetters(['account', 'sdk', 'activeAccount', 'popup', 'wallet']),
    },
    created() {
    },
    methods:{
        requirePasswordModal() {
            this.password = '';
            this.requirePass = true;
        },
        openSignPage() {
            this.loading = true;
            if (this.password != '') {
                browser.storage.local.get('userAccount').then(async (user) => {
                    if(user.userAccount && user.hasOwnProperty('userAccount')) {
                        let encryptedPrivateKey = JSON.parse(user.userAccount.encryptedPrivateKey);
                        let match = await addressGenerator.decryptKeystore(encryptedPrivateKey, this.password)
                        this.loading = false
                        if(match) {
                            this.requirePass = false;
                            this.page = 'sign';
                        }else {
                            this.passwordAlert = 'Incorrect password!';
                            setTimeout(() => {
                                this.passwordAlert = '';
                            }, 2800);
                        }
                    }
                })
            }
            else {
                this.loading = false;
                this.passwordAlert = 'Please enter valid password!';
                setTimeout(() => {
                    this.passwordAlert = '';
                }, 2800);
            }
        },
        async signMessageAction() {
            this.loading = true;
            let { secretKey } = await this.$store.dispatch('getKeyPair', { idx: this.activeAccount})
            try {
                const sign = Crypto.signPersonalMessage(this.signMessage, secretKey)
                this.signature = JSON.stringify(
                    { 
                        text: this.signMessage, 
                        sig: sign
                    }
                );
                this.loading = false;
                this.modalVisible = true;
            } catch (error) {
                console.log(error);
            }
        },
        verifyMessageAction() {
            try {
                let verObj = JSON.parse(this.verifyMessage);
                var signature = new Uint8Array(Object.values(verObj.sig));
                let publicKey = Buffer.from(Crypto.decodeBase58Check(this.account.publicKey.split('_')[1]))
                const verify = Crypto.verifyPersonalMessage( verObj.text, signature, publicKey );
                if (verify == true) {
                    this.$store.dispatch('popupAlert', { name: 'account', type: 'success_verifymessage'}).then( () => {
                        this.verifyMessage = '';
                    })
                }
                else {
                    this.$store.dispatch('popupAlert', { name: 'account', type: 'unsuccess_verifymessage'});
                }
            } catch (error) {
                console.log('error', error.toString());
                error = error.toString();
                if (error.includes('unexpected type') || error.includes('Cannot convert') || error.includes('Unexpected token') || error.includes('argument must be')) {
                    this.$store.dispatch('popupAlert', { name: 'account', type: 'token_add'});
                }
            }
        },
        doCopy() {
            this.$copyText(this.signature).then(e => {
                this.modalVisible = false
                this.alert.msg = "Message successfully copied!";
                this.alert.class = "success";
                this.signMessage = '';
                setTimeout(() => {
                    this.alert.msg = "";
                    this.alert.class = "";
                }, 2800);
            });
        },
        navigateUtilities(){
            this.$router.push('/utilities')
        },
    }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.ae-modal-light main + .buttons {
    display: none !important;
}
.signedmsg-modal {
    color: #000;
    font-weight: 600;
    font-size: 12px;
    background: #ccc;
    padding: 10px;
    border-radius: 20px;
}
.signature-buttons button, .h3-signature {
    margin: 0 !important;
}

.disabled {
  background: #ccc !important;
  pointer-events: none;
}
.success {
    color: #00b100;
    border: 1px solid #008600;
    font-weight: 500;
    font-size: 20px;
    padding: 5px;
    background: none;
}
.error {
    color: #ff0000;
    font-weight: 500;
    font-size: 20px;
    padding: 5px;
    background: none;
}
.signature-modal-buttons button {
    border: 2px solid;
    background: #ccc;
    color: #fff;
    padding: 1.5rem;
    border-radius: 20px;
    width: 50%;
    float: left;
    font-size: 15px;
}
.signMsg-copy {
    background: #FF0D6A !important;
}
</style>
