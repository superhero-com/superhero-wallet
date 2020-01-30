<template>
    <div class="popup">
        <BackLink to="/"></BackLink>
        <p class="importTitle">{{ $t('pages.index.enterSeedPhrase') }}</p>
        <ae-input label="Seed phrase" class="my-2">
            <textarea
                class="ae-input textarea"
                v-model="mnemonic"
                slot-scope="{ context }"
                @focus="context.focus = true"
                @blur="context.focus = false"
            />
            <ae-toolbar slot="footer">{{ errorMsg }}</ae-toolbar>
        </ae-input>

        <ae-button face="round" fill="primary" extend @click="importAccount" >{{ $t('pages.index.importAccount') }}</ae-button>
    </div>
</template>

<script>
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@aeternity/bip39';

export default {
    data () {
        return {
            mnemonic: null,
            errorMsg: null
        }
    },
    methods: {
        async importAccount() {
            if(this.mnemonic) {
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
                    this.errorMsg = 'Account not found. Please check your seed phrase';
                }
            }  else {
                this.errorMsg = 'Account not found. Please check your seed phrase';
            }
        }
    }
}
</script>
