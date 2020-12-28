<template>
  <div class="content">
    <ae-main>
      <ae-panel class="text-center">
        <img src="../icons/icon_128.png" alt="Superhero logo" />
        <h1><ae-icon fill="primary" face="round" name="info" />{{ $t('phishing.detection') }}</h1>
        <i18n
          v-for="(item, index) in $t('phishing.sections').length"
          :key="index"
          :path="`phishing.sections[${index}].text`"
          tag="p"
        >
          <template v-slot:insertion>
            <a>
              {{ $t(`phishing.sections[${index}].insertion`) }}
            </a>
          </template>
          <template v-slot:continueHost>
            <a @click.prevent="continueHost">
              {{ $t(`phishing.sections[${index}].continueHost`) }}
            </a>
          </template>
        </i18n>
      </ae-panel>
    </ae-main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      href: null,
      hostname: null,
    };
  },
  created() {
    const uri = window.location.href.split('#');
    if (typeof uri[1] !== 'undefined') {
      const url = uri[1].split('&');
      if (typeof url[0] !== 'undefined') {
        const host = url[0].split('=');
        if (typeof host[1] !== 'undefined') {
          [, this.hostname] = host;
        }
      }
      if (typeof url[1] !== 'undefined') {
        const host = url[1].split('=');
        if (typeof host[1] !== 'undefined') {
          [, this.href] = host;
        }
      }
    }
  },
  methods: {
    continueHost() {
      if (this.href !== '' && this.href != null) {
        browser.runtime
          .sendMessage({
            method: 'setPhishingUrl',
            params: {
              hostname: this.hostname,
            },
          })
          .catch(console.log);
        setInterval(() => {
          window.location.href = this.href;
        }, 500);
      }
    },
  },
};
</script>

<style lang="scss">
@import '../styles/variables';

body,
html,
.content {
  margin: 0;
  padding: 0;
  height: 100%;
}

.ae-panel {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  -ms-transform: translate(-50%, -50%);
  -webkit-transform: translate(-50%, -50%);
  padding: 15px;
  width: 80%;
  max-width: 80%;
}

.ae-icon {
  vertical-align: middle;
  margin-right: 5px;
  line-height: 32px;
  display: inline-block;
  margin-top: -5px;
}

p {
  font-size: 1.2rem;
  text-align: left;
}

a {
  color: $bg-color;
  text-decoration: underline;
  cursor: pointer;
}

.text-center {
  text-align: center;
}

.ae-main {
  background: $bg-color;
}
</style>
