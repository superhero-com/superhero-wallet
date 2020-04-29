<template>
  <div class="content">
    <ae-main>
      <ae-panel class="text-center">
        <img src="../icons/icon_128.png" alt="Superhero logo" />
        <h1><ae-icon fill="primary" face="round" name="info" />Superhero Phishing Detection</h1>
        <p>
          This domain is currently on the Superhero domain warning list. This means that based on
          information available to us, Superhero believes this domain could currently compromise
          your security and, as an added safety feature, Superhero has restricted access to the
          site. To override this, please read the rest of this warning for instructions on how to
          continue at your own risk.
        </p>
        <p>
          There are many reasons sites can appear on our warning list, and our warning list compiles
          from other widely used industry lists. Such reasons can include known fraud or security
          risks, such as domains that test positive on the <a>Superhero Phishing Detector</a>.
          Domains on these warning lists may include outright malicious websites and legitimate
          websites that have been compromised by a malicious actor.
        </p>
        <p>
          Note that this warning list is compiled on a voluntary basis. This list may be inaccurate
          or incomplete. Just because a domain does not appear on this list is not an implicit
          guarantee of that domain's safety. As always, your transactions are your own
          responsibility. If you wish to interact with any domain on our warning list, you can do so
          by <a @click.prevent="continueHost">continuing at your own risk</a>.
        </p>
        <p>
          If you think this domain is incorrectly flagged or if a blocked legitimate website has
          resolved its security issues,<a> please file an issue</a>.
        </p>
      </ae-panel>
    </ae-main>
  </div>
</template>

<script>
import { setInterval } from 'timers';

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
        browser.runtime.sendMessage({
          method: 'setPhishingUrl',
          params: {
            hostname: this.hostname,
          },
        });
        setInterval(() => {
          window.location.href = this.href;
        }, 500);
      }
    },
  },
};
</script>

<style lang="scss">
@import '../common/variables';
body,
html,
.content {
  margin: 0 !important;
  padding: 0 !important;
  height: 100% !important;
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
  max-width: 80% !important;
}
.ae-icon {
  vertical-align: middle;
  margin-right: 5px;
  line-height: 32px !important;
  display: inline-block !important;
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
  background: $bg-color !important;
}
</style>
