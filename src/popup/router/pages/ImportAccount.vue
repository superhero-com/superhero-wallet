<template>
    <div class="popup">
        <p class="regular-text">{{ $t('pages.index.enterSeedPhrase') }}</p>
        <Textarea v-model="mnemonic" :error="errorMsg ? true : false" />
        <Button @click="importAccount" :disabled="mnemonic && !disabled ? false : true">
            {{ $t('pages.index.importAccount') }}
        </Button>
        <div v-if="errorMsg" class="error-msg" v-html="errorMsg"></div>
        <Loader size="big" :loading="loading"></Loader>
    </div>
</template>

<script>
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@aeternity/bip39';

export default {
    data () {
        return {
            mnemonic: null,
            errorMsg: null,
            loading: false,
            disabled: false
        }
    },
    watch: {
        mnemonic() {
            this.disabled = false
            this.errorMsg = null
        }
    },
    methods: {
        async importAccount() {
            if(this.mnemonic) {
                this.loading = true
                let mnemonic = this.mnemonic.split(' ');
                if (mnemonic.length >= 12 && mnemonic.length <= 24 && validateMnemonic(this.mnemonic)) {
                    this.errorMsg = null
                    const seed = mnemonicToSeed(this.mnemonic).toString('hex')
                    const address = await this.$store.dispatch('generateWallet', { seed })
                    await browser.storage.local.set({ mnemonic: this.mnemonic })
                    const keypair = {
                        publicKey: address,
                        privateKey: seed
                    }
                    this.$store.dispatch('setLogin', { keypair })

                } else {
                    this.loading = false
                    this.disabled = true
                    this.errorMsg = 'Account not found. <br> Please check your seed phrase.';
                }
            }  else {
                this.disabled = true
                this.errorMsg = 'Account not found. <br> Please check your seed phrase.';
            }
        },
        validateMnemonic() {
            return validateMnemonic(this.mnemonic)
        }
    }
}
</script>
