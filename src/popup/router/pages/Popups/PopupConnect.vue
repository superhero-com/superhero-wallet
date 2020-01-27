<template>
    <div class="popup">
        <div class="flex identiconContainer">
            <div class="identicon">
                <img :src="faviconUrl" @error="imageError = true" v-if="!imageError">
                <ae-identicon :address="data.host" size="base"  v-if="imageError"/>
                <div class="accountName">{{ data.name }}</div>
                <div class="hostname">{{ data.host }}</div>
            </div>
            <div class="separator">
                <ae-icon name="check" />
            </div>
            <div class="identicon">
                <ae-identicon :address="account.publicKey" size="base"/>
                <div class="accountName">{{activeAccountName}}</div>
            </div>
        </div>
        
        <h2>
            <span class="primary">{{ data.host }} ({{ data.name }}) </span> 
            {{$t('pages.connectConfirm.websiteRequestconnect') }} 
            <ae-identicon class="send-account-icon" :address="account.publicKey" size="s" />  
            {{ activeAccountName }} 
        </h2>
        <ul>
            <ae-list-item fill="neutral" class="permission-set">
                <h4> {{ $t('pages.connectConfirm.addressLabel') }} </h4>
                <p> {{ $t('pages.connectConfirm.addressRequest') }} </p>
            </ae-list-item>
            <ae-list-item fill="neutral" class="permission-set">
                <h4> {{ $t('pages.connectConfirm.transactionLabel') }} </h4>
                <p> {{ $t('pages.connectConfirm.transactionRequest') }} </p>
            </ae-list-item>
        </ul>
        <!-- <p>{{$t('pages.connectConfirm.websiteRequest') }}</p> -->
        <ae-button-group class="btnFixed">
            <ae-button face="round" fill="primary" @click="cancel">{{$t('pages.connectConfirm.cancelButton') }}</ae-button>
            <ae-button face="round" fill="alternative" @click="connect">{{$t('pages.connectConfirm.confirmButton') }}</ae-button>
        </ae-button-group>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setConnectedAepp, checkAeppConnected, setPermissionForAccount } from '../../../utils/helper';

export default {
    data(){
        return {
            data: window.props,
            imageError: false
        }
    },
    methods: {
        cancel() {
            if(Object.keys( this.data.action).length) {
                this.data.action.deny()
            }
           
            this.data.reject()
        },
        async connect() {
            await setPermissionForAccount(this.data.host, this.account.publicKey)
            if(Object.keys( this.data.action).length) {
                this.data.action.accept()
            }
            this.data.resolve()
        }
    },
    computed: {
        ...mapGetters(['account','activeAccountName']),
        faviconUrl() {
            return typeof this.data.icons != "undefined" ? this.data.icons : `${this.data.protocol}//${this.data.host}/favicon.ico`
        }
    }
}
</script>

<style lang="scss" scoped>
@import '../../../../common/base';
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

.permission-set {
    flex-direction: column;
    text-align: left;

    h4{ 
        display: block;
        width:100%;
        margin:0;
    }
    p {
        display: block;
        width:100%;
        margin:0;
    }
}
ul {
    padding:0;
}


</style>