<template>
    <div class="popup">
        <div class="flex identiconContainer">
            <div class="identicon">
                <img :src="faviconUrl" >
                <div class="accountName">{{data.params.title}}</div>
                <div class="hostname">{{data.params.hostname}}</div>
            </div>
            <div class="separator">
                <ae-icon name="check" />
            </div>
            <div class="identicon">
                <ae-identicon :address="account.publicKey" size="base"/>
                <div class="accountName">{{activeAccountName}}</div>
            </div>
        </div>
        
        <h2><span class="primary">{{data.params.title}}</span> {{$t('pages.connectConfirm.websiteRequestconnect') }} </h2>
        <p>{{$t('pages.connectConfirm.websiteRequest') }}</p>
        <ae-button-group class="btnFixed">
            <ae-button face="round" fill="primary" @click="cancel">{{$t('pages.connectConfirm.cancelButton') }}</ae-button>
            <ae-button face="round" fill="alternative" @click="connect">{{$t('pages.connectConfirm.confirmButton') }}</ae-button>
        </ae-button-group>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setConnectedAepp, checkAeppConnected } from '../../utils/helper';

export default {
    data(){
        return {
            port:null,
            errorTx:  {
                "error": {
                    "code": 1,
                    "data": {
                        "request": {}
                    },
                    "message": "Transaction verification failed"
                },
                "id": null,
                "jsonrpc": "2.0"
            }
        }
    },
    props:['data'],
    created() {
        if(this.data.popup) {
            this.port = browser.runtime.connect({ name: this.data.id })
            this.port.onMessage.addListener((msg, sender,sendResponse) => {})
        }
    },
    methods: {
        cancel() {
            if(this.data.popup) {
                this.errorTx.error.message = "Connection canceled"
                this.port.postMessage(this.errorTx)
            }
            setTimeout(() => {
                window.close()
            },1000)
            
        },
        connect() {
            setConnectedAepp(this.data.params.hostname, this.account.publicKey)
            .then(() => {
                if(this.data.popup) {
                    this.port.postMessage({id:null,jsonrpc:"2.0",message:"Connection established"})
                }
                setTimeout(() => {
                    window.close()
                },1000)
            })
            
        }
    },
    computed: {
        ...mapGetters(['account','activeAccountName']),
        faviconUrl() {
            return `${this.data.params.protocol}//${this.data.params.hostname}/favicon.ico`
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.primary {
    color:$primary-color;
}
h2{
    word-break:break-word;
    line-height:1.8rem;
    font-size:1.5rem
}
p{
    font-weight:normal;
    word-break:break-word;
    font-size:.9rem
}
.accountName {
    font-size:1rem;
}
.hostname {
    font-size:.8rem;
}
.identiconContainer {
    position:relative;
    margin-top:2rem;
    &:before {
        content:""
    }
    .identicon {
        width:50%;
        background:fixed linear-gradient(to bottom, white, #F1F4F7);
        position:relative;
        z-index:0;
        img {
            height:4rem;
            background:fixed linear-gradient(to bottom, white, #F1F4F7);
            position:relative;
            z-index:1;
        }
        .ae-identicon {
            height:4rem !important;
            background:fixed linear-gradient(to bottom, white, #F1F4F7);
            position:relative;
            z-index:1;
            padding:0 .9rem !important;
        }
    }
    .identicon:first-child:after, .identicon:last-child:after {
        content: "";
        width: 40%;
        border-top: 2px dashed #ccc;
        height: 1px;
        display: inline-block;
        position: absolute;
        left: 0;
        top: 2rem;
        transform: translateY(-50%);
        -ms-transform: translateY(-50%);
        -webkit-transform: translateY(-50%);
    }
    .identicon:first-child:after {
        right:0;
        left:auto;
    }
    .identicon:last-child:after {
        left:0;
    }
    .separator {
        margin-top:1rem;
        padding: 0 .7rem;
        .ae-icon {
            background:$color-alternative;
            padding:.5rem;
            color:#fff;
            border-radius: 50%;
        }
    }

}


</style>
