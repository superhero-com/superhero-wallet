
import { Crypto } from '@aeternity/aepp-sdk/es';

export default  {
    async ledgerRequest({ commit, state, getters: { ledgerApi } }, { name, args}) {
        let error
        let result
        do {
            try {
                result = await ledgerApi[name](...args)
                error = false
            }catch(err) {
                error = true
            }finally {

            }

        } while (error)

        return result
    },

    async ledgerCreate({ commit, state, getters: { ledgerApi, ledgerNextIdx }, dispatch } ) {
        return new Promise(async (resolve, reject) => {
            try {
                let address = await ledgerApi.getAddress(ledgerNextIdx)
                let idx = ledgerNextIdx
                
                dispatch('setSubAccount', {
                    isLedger: true,
                    name: `Ledger Account # ${idx + 1}`,
                    publicKey: address,
                    root:false,
                    idx:ledgerNextIdx ,
                    balance:0
                }).then(() => {
                    commit('SET_ACTIVE_ACCOUNT', { publicKey:address, index:state.subaccounts.length - 1 })
                    browser.storage.local.set({ subaccounts: state.subaccounts}).then(() => {
                        dispatch('popupAlert', {
                            name: 'account',
                            type: 'added_success'
                        }).then(() => {
                            resolve({ success:true })
                        })
                    })
                    
                })
    
            } catch (err) {
                resolve({ success:false, error: err })
            } finally {
                
            }
        })
    },

    async ledgerSignTransaction ({ commit, state:{ sdk }, getters: { ledgerApi, getActiveAccount } }, { tx } ) {
        return new Promise(async (resolve, reject) => {
            try {
                tx = Crypto.decodeBase64Check(Crypto.assertedType(tx, 'tx'))
                let sign = Buffer.from(await ledgerApi.signTransaction( getActiveAccount.idx , tx, sdk.networkId ),'hex')
                let encodeTx = Crypto.encodeTx(Crypto.prepareTx(sign, tx))
                let transaction = await sdk.sendTransaction(encodeTx)
                resolve({ success:true, res:transaction })
            }catch(e) {
                resolve({ success:false, error: e })
            }finally {

            }
        })
    }
} 