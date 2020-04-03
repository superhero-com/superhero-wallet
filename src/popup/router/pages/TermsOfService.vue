<template>
  <div class="popup text-left terms">
    <!-- header -->
    <h1 class="terms--heading heading-1 uppercase bolder">TERMS OF USE</h1>
    <p class="italic">
      The present
      <b>TERMS OF USE</b> were created on 3 th April 2020.
    </p>
    <p class="italic">
      <b>Superhero.com LVC</b> reserves its right to modify and update these <b>TERMS OF USE</b> according to the policy and practice of the <b>company</b>. The new version of thе
      <b>TERMS OF USE</b> becomes effective from the day it is announced on <b>Our Superhero Wallet</b> unless stated otherwise.
    </p>
    <hr />
    <p class="bolder">
      THE SOFTWARE IS PROVIDED BY SUPERHERO.COM LVC “AS IS” WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
      FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
      TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
    </p>
    <p>
      These <b>TERMS OF USE („TERMS“)</b> apply exclusively for the <b>SuperHero Wallet</b> (hereinafter referred to as the “<b>Wallet</b>” or the “<b>application</b>”) and all the
      content available on the website extension. Please make sure that you have carefully read the <b>TERMS</b> before using the <b>application</b>. Otherwise, by using it, we
      consider these actions implicit agreement to the <b>TERMS OF USE</b>. These <b>TERMS OF USE</b> represent a binding agreement between you, the legal entity you represent and
      the legal entity that registered you (collectively „<b>YOU</b>“) and <b>Superhero.com LVC (“Superhero”, “we”, “us”</b> or <b>“our”)</b> in connection to your use of the
      <b>SuperHero Wallet website extension</b>.
    </p>
    <p>Please, do not use the application provided by <b>Superhero</b>, if you do not agree to the <b>TERMS</b> applied within this document.</p>
    <p>
      <b>WE</b> preserve our right to modify the <b>TERMS</b> at any time in our sole discretion. <b>USERS</b> will be notified of such changes by posting information for the new
      Effective Date of the <b>TERMS</b> on the <b>application</b>. <b>YOU</b> may be required to read and accept the updated <b>TERMS</b> in order to continue your use of the
      <b>Wallet</b>. If <b>YOU</b> continue to use the <b>Wallet</b> after a notification for the amended <b>TERMS</b>, <b>YOU</b> are agreeing to be bound by the modifications. If
      you don’t agree to be bound by the modified <b>TERMS</b>, then you should discontinue any use of the <b>Wallet</b>. Please contact <b>Superhero</b> via an email to
      <a href="mailto:superherowallet@protonmail.com">superherowallet@protonmail.com</a> for the provision of information about the steps for termination of your use. Please check
      the Effective Date above to determine if there have been any changes since <b>YOU</b> have last reviewed these <b>TERMS</b>.
    </p>
    <p class="italic underline">Once you agree to the <b>TERMS OF USE</b>, we consider this an explicit consent to the following:</p>

    <div v-for="(item, index) in details" :key="index">
      <p class="accordion-item-title uppercase flex flex-justify-between flex-align-start" @click="toggleAccordionItem(index)" data-cy="accordion-item">
        <ArrowDown class="icon" v-if="item.open" data-cy="accordion-item-open" />
        <ArrowRight class="icon" v-else data-cy="accordion-item-close" />
        <span>{{ item.title }}</span>
      </p>
      <div v-if="index == 0" class="accordion-item-content" v-show="item.open" data-cy="accordion-item-content">
        <p>
          1.1. <strong>Superhero.com Establishment (&ldquo;Superhero&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo; </strong>or<strong>
            &ldquo;the company&rdquo;</strong
          >) is a company with seat and registered address at: Dr. Grass Str. 12, 9490 Vaduz, Liechtenstein, with email address for communication related to the
          <strong>SuperHero Wallet</strong>: superherowallet@protonmail.com. <strong>Superhero</strong> is the company, which created and developed
          <strong>SuperHero Wallet</strong>.
        </p>
        <p>
          1.2. &ldquo;<strong>USER</strong>&ldquo; or &ldquo;<strong>YOU</strong>&ldquo; means a natural or legal person, who has downloaded and uses the
          <strong>SuperHero Wallet</strong> <strong>website extension</strong>.
        </p>
        <p>
          1.3. &ldquo;<strong>Blockchain</strong>&ldquo; means the list of records, also known as <em>blocks</em>, which are linked with the method of cryptography. The technology
          allows large groups of people to connect and reach agreement on data, which is afterwards permanently recorded without the presence of central authority.
          <strong>USERS</strong> can access, create and save information on the <strong>Aeternity blockchain</strong>. The decentralized, distributed and public digital ledger is
          used for the purpose of recording transactions in blocks of information with the help of <strong>Validators</strong>, which cannot be altered retroactively.
        </p>
        <p>
          1.4. &ldquo;<strong>SuperHero Wallet</strong>&rdquo; (&ldquo;<strong>WALLET</strong>&rdquo; or &ldquo;<strong>application</strong>&rdquo;) is a website extension, which
          allows supporters to send value to content creators, causes, charities, groups or regular individuals online as a reward for contributing accurate information, relevant
          insights, quality content. The website extension is a piece of software which acts as an add-on to the web browsers Firefox, Chrome, Brave and Opera and contributes to
          the browsers&rsquo; additional functionalities. The application is available at: 1) for Firefox:
          <a href="https://addons.mozilla.org/en-US/firefox/addon/superhero-wallet-extension/">https://addons.mozilla.org/en-US/firefox/addon/superhero-wallet-extension/</a>; 2)
          for Chrome, Brave and Opera:
          <a href="https://chrome.google.com/webstore/detail/superhero/mnhmmkepfddpifjkamaligfeemcbhdne/related"
            >https://chrome.google.com/webstore/detail/superhero/mnhmmkepfddpifjkamaligfeemcbhdne/related</a
          >
        </p>
        <p>The results of the donations and comments are published on the website <a href="https://youdonotneedacapetobeahero.com/">www.superhero.com</a> .</p>
        <p>
          1.5<strong>. </strong><strong>&ldquo;&AElig;id&ldquo;, &ldquo;&AElig;ternity token&rdquo;</strong> or &ldquo;<strong>&AElig; token</strong>&rdquo; are the
          <strong>&AElig;ternity</strong> digital assets, which can be tracked or transferred on the <strong>&AElig;ternity blockchain. </strong>
        </p>
        <p>
          1.6. &ldquo;<strong>Validators</strong>&rdquo; are independent physical persons or entities, which are not in any way part of <strong>Superhero</strong>. Their function
          in the system includes responsibility for <em>blocks</em> constitution and broadcast of these <em>blocks</em> with the <strong>Aeternity</strong>
          <strong>blockchain</strong>.
        </p>
        <p>
          1.7. &ldquo;<strong>Account address</strong>&rdquo; or &ldquo;<strong>Wallet address</strong>&rdquo; is a hashed version of the <strong>USER&rsquo;s public key</strong>,
          used to identify <strong>USERS</strong> on the <strong>application</strong>.
        </p>
        <p>
          1.8. &ldquo;<strong>Keys</strong>&rdquo; represent uniquely related private and public cryptographic keys of random numbers used for encryption and decryption of
          information.
        </p>
        <p>
          1.9. &ldquo;<strong>&AElig;ternity Naming System</strong>&rdquo; allows <strong>USERS</strong> to claim names and associate them with one or more
          <strong>&AElig;ternity</strong> accounts.
        </p>
        <p>
          1.10. &ldquo;<strong>Name of account</strong>&rdquo; is a domain-like identification string, which allows <strong>USERS</strong> control over its creation, development
          and alienation.
        </p>
      </div>

      <div v-if="index == 1" class="accordion-item-content" v-show="item.open" data-cy="accordion-item-content">
        <p><strong>2.1. The application </strong></p>
        <p><strong>&nbsp;</strong></p>
        <p>
          <strong>Superhero</strong> designed and built the <strong>application</strong> as a cryptocurrency wallet, which once installed, acts as a website extension for the
          browsers Firefox, Chrome, Brave and Opera.
        </p>
        <p>
          Through it <strong>USERS</strong> can store, send and collect <strong>&AElig; tokens.</strong> &nbsp;The purpose is to conduct donations to creators, causes, charities,
          groups, or regular individuals online as a reward for contributing accurate information, relevant insights, quality content. <strong>USERS</strong> can donate to
          different platforms through the <strong>application</strong>.
        </p>
        <p>&nbsp;</p>
        <p>
          The <strong>Wallet</strong> is a software solution, the interface is provided with the purpose of facilitating the interaction between the <strong>USERS</strong> and the
          protocols of the <strong>A</strong><strong>eternity blockchain,</strong> to manage your <strong>account</strong> and your <strong>&AElig; tokens. </strong>The Protocols
          represent a system that is implemented with the purpose of reaching consensus between <strong>USERS</strong> and validating transactions on the <strong>A</strong
          ><strong>eternity blockchain.</strong> <strong>Superhero</strong> does not in any way control the blockchain due to the fact it is decentralized and all transactions are
          executed between <strong>USERS</strong> in a peer-to-peer manner in which <strong>Superhero</strong> is not involved.
        </p>
        <p>&nbsp;</p>
        <p><strong>2.2. Sending tips</strong></p>
        <p><strong>&nbsp;</strong></p>
        <p>
          The <strong>application</strong> automatically searches for the public key of a website for the purpose of the donation. Once <strong>YOU</strong> are on the URL address
          that<strong> YOU </strong>want to tip, you have to:
        </p>
        <ul>
          <li>Open your Superhero wallet extension. The button should be in the upper right of your browser tool bar.</li>
          <li>Click Tip someone.</li>
          <li>
            On the next screen, fill in the required fields. Enter the amount of tips <strong>YOU</strong> want to send, and add a message telling the receiver why they&rsquo;re
            awesome.
          </li>
          <li>Click Send tip.</li>
          <li>On the next screen, review the details of your tip.</li>
          <li>Click Confirm to complete the transaction.</li>
        </ul>
        <p>&nbsp;</p>
        <p>Please bear in mind that the transactions are irreversible when completed.</p>
        <p>&nbsp;</p>
        <p>
          The donations can be oriented in two flows as it follows - <strong>USERS</strong> can tip the owner of the whole website/platform or the specific creator/author on the
          platform who has written/prepared the news/article/section/material.
        </p>
        <p>&nbsp;</p>
        <p>
          After that, the website - <a href="https://youdonotneedacapetobeahero.com/">https://youdonotneedacapetobeahero.com/</a>, reflects the
          <strong>USERS&rsquo;</strong> donations and comments and gives the possibility for other <strong>USERS</strong> to actively donate and comment on the newsfeed of the
          Website.
        </p>
        <p>&nbsp;</p>
        <p><strong>2.3. Collecting tips</strong></p>
        <p>&nbsp;</p>
        <p>
          If <strong>YOU</strong> want to receive such tips yourself, copy your <strong>Wallet address </strong>and paste it onto your web page or profile &ndash; it could be a
          blog, a social media account or any other online profile. Save the change and refresh the page. <strong>YOU</strong> can also add your<strong> Wallet address</strong> in
          the source code of the web page. Then, <strong>YOU</strong> should open your <strong>SuperHero Wallet</strong> to access the tips received. Please bear in mind that there
          may be slight delays in collecting tips, we advise that you wait for a few minutes and open the <strong>Wallet </strong>again. Do not hesitate to contact us if
          <strong>YOU</strong> experience any difficulties.
        </p>
        <p>&nbsp;</p>
        <p><strong>2.4. Loading your wallet</strong></p>
        <p><strong>&nbsp;</strong></p>
        <p>
          In order to load your <strong>Wallet </strong>with <strong>&AElig; tokens,</strong> you can exchange other cryptocurrencies or fiat currencies with
          <strong>&AElig; tokens</strong> through partnering third-party platforms. A full list of these platforms, you can see in our Superhero Tutorial. Our team is also ready to
          provide detailed information when contacted through email at <a href="mailto:superherowallet@protonmail.com">superherowallet@protonmail.com</a>.
        </p>
        <p>Please bear in mind that the third-party platforms may collect fees. They are unilaterally determined and are not an object of control by <strong>Superhero</strong>.</p>
        <p><strong>&nbsp;</strong></p>
        <p><strong>2.5. Withdrawing tips</strong></p>
        <p><strong>&nbsp;</strong></p>
        <p>
          To withdraw your tips, <strong>YOU</strong> can use one of the third-party crypto exchanges that supports <strong>&AElig; tokens. </strong>Again, additional information
          about the platforms can be seen in our Superhero Tutorial and <strong>WE</strong> are at disposal for further assistance.
        </p>
        <p><strong>&nbsp;</strong></p>
        <p><strong>2.6. Transactions on the application</strong></p>
        <p><strong>&nbsp;</strong></p>
        <p>
          <strong>USERS</strong> can browse through their transaction history. <strong>The Wallet</strong> displays the <strong>USER&rsquo;s</strong> tokens.
          <strong>USERS</strong> are in charge of the safe storage, sending and receiving of funds.
        </p>
        <p>&nbsp;</p>
        <p>
          The application is built for small transactions. High volume transactions or storage can be undertaken via the application at the <strong>USER&rsquo;s</strong> own risk.
        </p>
      </div>
      <div v-if="index == 2" class="accordion-item-content" v-show="item.open" data-cy="accordion-item-content">
        <p>The application gives two possibilities for identification of <strong>USERS</strong> as it follows:</p>
        <ul>
          <li><strong>Account address</strong></li>
          <li><strong>Name of account </strong></li>
        </ul>
        <p>
          The <strong>Account address</strong> consists of random string of numbers and letters that starts with &ldquo;ak_&rdquo;. <strong>USERS</strong> can find their
          <strong>Wallet addresses</strong> on the dashboard, right above the balance. The <strong>Account address</strong> is the public ID other <strong>USERS</strong> see by
          default. Once a <strong>USER</strong> has downloaded the <strong>application</strong>, the <strong>Wallet </strong>automatically generates the account address.<strong
            >&nbsp;
          </strong>
        </p>
        <p>&nbsp;</p>
        <p>
          In addition, <strong>USERS</strong> are given the option to claim a <strong>name</strong> for their account(s) via the <strong>&AElig;ternity Naming System</strong>. If a
          <strong>USER</strong> claims a <strong>name</strong> on the <strong>application</strong>, other <strong>USERS</strong> may associate it with the corresponding account.
          <strong>USERS</strong> are free to choose the <strong>name</strong>. The only requirement is that the <strong>USER</strong> must have a minimum of
          <strong>&AElig; tokens </strong>in the <strong>WALLET</strong><strong> depending on the number of letters of the domain to be claimed</strong>. <strong>We</strong> request
          from <strong>USERS</strong> not to use any offensive, racist, misleading, provocative or any other inappropriate wording.
        </p>
        <p>&nbsp;</p>
        <p>
          The idea behind account <strong>names</strong> is to serve as an alternative to the <strong>Account address</strong>, making it much easier for other
          <strong>USERS</strong> to send a tip.
        </p>
        <p>&nbsp;</p>
        <p><strong>USERS</strong> can claim <strong>names</strong> via a set of smart contracts. The name establishment to a person can be an object of an auction.</p>
        <p>
          In Section &ldquo;Names&rdquo; every <strong>USER</strong> can freely claim a <strong>name</strong>. The <strong>name</strong> pre-claim requires the payment of a
          transaction fee in micro <strong>&AElig; tokens</strong> and the commitment of the fee to the <strong>USER</strong> owned account. Once a person has set up a
          <strong>name</strong>, the <strong>&AElig;ternity Naming System</strong> launches an auction within which all <strong>USERS</strong> of the <strong>WALLET</strong> can bid
          and within which a final <strong>name</strong> fee is paid. Please bear in mind that <strong>names</strong> with 13 (thirteen) or more characters are claimed directly
          without undergoing an auction and after the payment of the <strong>name</strong> fee. The period of time during which the auction is available (for names with less than 13
          characters) cannot be specified- it is based on the length of the name and the number of bids. Each bid resets the auction counter on the ongoing auction. The highest bid
          after the time has passed, receives the <strong>name</strong>. Please bear in mind that the person who has suggested the <strong>name</strong> and the person who has
          received the <strong>name</strong> can be two separate people and the claim of the <strong>name</strong> solely depends on the bids in the auctions.
          <strong>Superhero</strong> does not regulate or control the auctions. The claim is only available for 100 (one hundred) days.
        </p>
        <p>
          Before the lapse of 100 (one hundred) days, if the <strong>USER</strong> wants to preserve the <strong>name</strong>, they should update the claim and pay for the same.
          Each update is for one more period of 100 (one hundred) days with an option for reservation for an additional period of 100 (one hundred) days. Once it reaches the
          expiration date on the claim, the <strong>name</strong> is released, i.e. transition into the unclaimed state, after which it can be claimed again. During the claim, if the
          <strong>USER</strong> decides to extend the account related name, they shall only pay the transaction fee without paying additional name fees. The extension possibility is
          available within the above-mentioned period of 100 (one hundred) days and is not a prerequisite for renewal of the period.&nbsp;
        </p>
        <p>
          The <strong>&AElig;ternity Naming System</strong> gives the possibility for <strong>USERS</strong> to exchange and transfer their <strong>names</strong>. The
          <strong>USER</strong> who has received the <strong>name</strong> can transfer it to an account of another <strong>USER</strong>- third party, or another
          <strong>&AElig; Wallet address</strong> the <strong>USER</strong> owns. <strong>USERS</strong> understand and accept that <strong>Superhero</strong> does not control in any
          way the assignment and alienation of <strong>names</strong>. The decisions undertaken during the claim period of the <strong>name</strong> are a result of the
          <strong>USER&rsquo;s</strong> sole estimation.
        </p>
        <p>
          The <strong>name</strong> can also be used as your profile name on the Superhero website
          <a href="https://youdonotneedacapetobeahero.com/">https://youdonotneedacapetobeahero.com/</a>.
        </p>
        <p>&nbsp;</p>
        <p>&nbsp;</p>
        <p>
          According to the Superhero Tuturial: &ldquo;When moving .chain names to another AE wallet address that you own, please make sure that you hold the private keys to that
          wallet address. In the case of wallet addresses in crypto exchanges, the exchange holds the private keys. This means that your .chain name will not be under your control.
          (Please ask Milen to confirm this)&rdquo;
        </p>
        <p>&nbsp;</p>
        <p>This should be arranged in the ToS, once confirmed.</p>
      </div>

      <div v-if="index == 3" class="accordion-item-content" v-show="item.open" data-cy="accordion-item-content">
        <p>As a <strong>USER</strong>, <strong>YOU</strong> agree to the following rules applicable for <strong>the SuperHero Wallet</strong> :</p>
        <p>&nbsp;</p>
        <ul>
          <li>
            <strong>YOU</strong> shall comply with the rules set within the present <strong>TERMS</strong> and perform any actions on the <strong>application</strong> in good faith
            and according to the applicable legislation;
          </li>
          <li><strong>YOU</strong> are an adult and <strong>YOU</strong> are not persons under judicial disability (<strong>YOU</strong> have obtained full legal capacity);</li>
          <li>
            <strong>YOU</strong> shall not try to obtain or gain access over any personal or identifiable information, including but not limited to seed phrases, private keys, from
            other <strong>USERS</strong>, nor shall <strong>YOU</strong> disclose such information about yourself;
          </li>
          <li>
            <strong>YOU</strong> shall not in any way compromise or exploit the <strong>application</strong> or use the <strong>application</strong> for any illegal activity or
            outside the purpose for its creation;
          </li>
          <li>
            <strong>Your</strong> actions do not in any manner mislead into thinking that <strong>YOU</strong> are another person or company; <strong>YOU</strong> shall not
            purposefully provide information by using another person&rsquo;s seed phrases, <strong>account addresses</strong>, <strong>account</strong> <strong>names</strong> with
            the purpose of representing as somebody else. <strong>Superhero</strong> shall undertake any possible action against such identity thefts and frauds in case the
            <strong>company</strong> suspects a <strong>USER</strong>;
          </li>
          <li>the device <strong>YOU</strong> use does not contain or install any viruses, worms, malware, Trojan horses or other harmful or destructive content.</li>
        </ul>
        <p>&nbsp;</p>
        <p><strong>USERS</strong> shall be liable for any action undertaken in violation of the present article.</p>
      </div>
      <div v-if="index == 4" class="accordion-item-content" v-show="item.open" data-cy="accordion-item-content">
        <p>
          As mentioned above, the <strong>Wallet</strong> is only a software solution, which facilitates the interaction between <strong>USER</strong><strong>S</strong> and the
          decentralized, public ledger. Therefore, <strong>YOU</strong> are solely responsible and liable for any and all of your actions and inactions on the
          <strong>application</strong> and all gains and losses sustained from your use of it. <strong>YOU</strong> indemnify <strong>Superhero</strong>, its employees and affiliates
          in full for any and all negative consequences that might arise from the use of the <strong>application</strong> due to the lack of control over the peer-to-peer activities.
        </p>
        <p>&nbsp;</p>
        <p>
          <strong><u>General Disclaimer:</u></strong> The <strong>&AElig;ternity blockchain</strong> is open-source, public and permissionless ledger, meaning that anyone can
          download, participate, develop, improve and validate transactions on the <strong>blockchain</strong>. <strong>Superhero</strong> cannot and does not control in any way the
          transactions conducted by <strong>USERS</strong>. <strong>Superhero</strong> does not ensure the trustworthiness and validity of the same. Please, bear in mind that every
          <strong>USER</strong> is solely responsible for the actions undertaken on the <strong>application</strong> and the information presented by them.
        </p>
        <p>&nbsp;</p>
        <p>
          <strong><u>Password and Seed Phrase Security Disclaimer:</u></strong> <strong>USERS</strong> take responsibility for their digital security. The
          <strong>application</strong> gives the possibility to set up a seed phrase, consisting of random unique combination of words. The purpose of the seed phrase is to restore
          the access to the <strong>account</strong>, once the <strong>USER</strong> has lost access to the original <strong>Wallet</strong> for any reason (migrating to a new
          device, reinstalling browser, etc.). <strong>Superhero</strong>
          <strong
            >does not collect the private keys or the seed phrases and shall not be treated under any circumstances as a custodian wallet provider. WE HIGHLY RECOMMEND ALL USERS TO
            SET UP A SEED PHRASE AND PROTECT IT.</strong
          >
          <strong>USERS</strong> should store their seed phrase offline safely. Please bear in mind that if a <strong>USER</strong> has not set up a seed phrase for backup or they
          have forgotten the seed phrase and its exact wording, the access to their <strong>accounts</strong> can be permanently restricted. The lack of access does not mean in any
          way that the <strong>&AElig; </strong><strong>tokens</strong> are lost. The <strong>&AElig; </strong><strong>tokens</strong> remain available, however, they cannot be
          controlled, transferred and any other action with them cannot be undertaken. <strong>Superhero</strong> shall not be held liable in any case of lost, forgotten or
          misspelled seed phrases. In addition, <strong>USERS</strong> must not share their seed phrase with anyone. <strong>Superhero</strong> should not be liable for any claim,
          damages or other liability, tort or otherwise, arising from, out of or in connection with the impossibility of <strong>USERS</strong> to regain access to their account on
          the <strong>Wallet</strong>.
        </p>
        <p>&nbsp;</p>
        <p>
          Please bear in mind that the option &ldquo;Already have an account? Retrieve existing account&rdquo; is applicable only in case the <strong>USER</strong> has a seed phrase.
        </p>
        <p>&nbsp;</p>
        <p>
          <strong><u>Decentralization and Control </u></strong><strong><u>Transparency Disclaimer</u></strong
          >: <strong>Blockchain</strong> technology is decentralized by nature- which means that the makers of the <strong>Wallet</strong> cannot access or freeze your
          <strong>account</strong>; recover or reset your seed phrase; reverse, cancel or refund transactions. Only <strong>USERS</strong> are in charge of the safe storage and
          sending of their funds. By agreeing to the present <strong>TERMS</strong>, <strong>USERS</strong> accept and guarantee to defend, indemnify and hold
          <strong>Superhero</strong> harmless from and against any and all claims, costs, expenses, including but not limited to attorneys&rsquo; fees, damages, etc., related to or
          arising from the use of the <strong>application</strong>.
        </p>
        <p>&nbsp;</p>
        <p>
          <strong><u>Access and Connectivity Disclaimer</u></strong
          >: The <strong>Wallet</strong> can be downloaded from https://addons.mozilla.org/en-US/firefox/addon/superhero-wallet-extension/ (for Firefox) and
          <a href="https://chrome.google.com/webstore/detail/superhero/mnhmmkepfddpifjkamaligfeemcbhdne/related"
            >https://chrome.google.com/webstore/detail/superhero/mnhmmkepfddpifjkamaligfeemcbhdne/related</a
          >
          &nbsp;for Chrome, Brave and Opera. Please bear in mind that the Internet browsers can cease the supporting of the <strong>extension</strong> &nbsp;in their own estimation,
          making it difficult or impossible to receive any functionality from the browser or updates. Devices on which the <strong>Wallet</strong> is installed are likely to be
          harmed by malware/spyware/viruses/cyber-attacks, etc. or during technical support. Damage or loss of the device can possibly result in loss of funds or endanger them.
          Therefore, please refer to section <strong><u>Password and Seed Phrase Security Disclaimer</u></strong> in regard to seed phrases. <strong>Superhero</strong> is not
          responsible for any of the above-mentioned access and connectivity troubleshooting. Therefore, <strong>WE</strong> shall not be held liable for any loss of data on the
          <strong>application</strong> caused in these cases.
        </p>
        <p>&nbsp;</p>
        <p>
          <strong><u>Cryptocurrency Guidance Disclaimer:</u></strong> The content presented on the <strong>application</strong> is not intended to be used as guide for cryptocurrency
          investments or signing of other legal agreements in connection to cryptocurrencies. <strong>Superhero</strong> does not offer business advices, which can be used as a legal
          basis for any investments or agreements in the sphere. <strong>Superhero</strong> shall not be held liable in any case of negative consequences from transactions or
          non-compliance with obligations of legal agreements signed by <strong>YOU</strong>, including but not only losses, tort, revenue, income or profits loss arising out of the
          contracts/ transactions/investment acts/agreements.
        </p>
        <p>&nbsp;</p>
        <p>
          <strong><u>Jurisdiction and Regulatory Disclaimer:</u></strong> The access to the <strong>application</strong> is granted worldwide. The use of the
          <strong>Wallet extension</strong> may be technically restricted or prohibited in certain territories and countries depending on the different legal acts. Please, bear in
          mind that <strong>YOU</strong> have to inform yourself about such legal restrictions and <strong>YOU</strong> are liable solely in case of a breach of any legal norms. The
          access to our <strong>application</strong> is prohibited provided the access point is in a territory where the content is illegal. <strong>Superhero</strong> does not have
          the obligation to control the legislation applicability according to each access point of <strong>USERS</strong> and shall not be held liable in these circumstances.
        </p>
        <p>&nbsp;</p>
        <p>
          <strong>USERS</strong> understand and accept that the legislation on a national, regional and international levels can introduce new regulations with an object- blockchain
          technology, tokens, blockchain technology based applications, etc. Therefore, in case of regulatory restrictions, bans and prohibitions, the
          <strong>&AElig;ternity blockchain&rsquo;s</strong> or the <strong>Wallet extension&rsquo;s </strong>development shall be immensely influenced, probably causing its
          termination. Taking into account the above-mentioned, <strong>USERS</strong> understand that there is no assurance that they will constantly or for indefinite period of
          time receive any functionality through the <strong>application</strong> or the <strong>&AElig;</strong> <strong>tokens</strong> held by them.
        </p>
        <p>&nbsp;</p>
        <p>
          <strong><u>Risks</u></strong
          >: <strong>USERS</strong> understand and agree with the risks related to the <strong>&AElig;ternity blockchain</strong> contribution and/or with the allocation, use and
          ownership of <strong>&AElig;</strong> <strong>tokens</strong> and guarantee to relieve of responsibility <strong>Superhero</strong> in these cases.
        </p>
        <p>The risks mentioned within the present <strong>TERMS</strong> are not comprehensive:</p>
        <p>&nbsp;</p>
        <ul>
          <li>
            <u>Risk of software weaknesses: </u><strong>USERS</strong> understand and accept that due to the open-source, decentralized, public, permissionless cloud concept, the
            software, the blockchain technology, incorporating all elements and the <strong>application</strong> are in a constant development process. There is no warranty that the
            receipt and transfer of <strong>&AElig;</strong> <strong>tokens</strong> shall be uninterrupted or error-free at all times. <strong>USERS</strong> accept and guarantee to
            dispense of responsibility <strong>Superhero</strong> for any software or technology weaknesses, malfunctions, vulnerabilities or bugs, which can cause complete or
            partial loss of <strong>&AElig;</strong><strong> tokens</strong>.
          </li>
          <li>
            <u>Risk of theft:</u> <strong>USERS</strong> understand and accept that due to the open-source, decentralized, public, permissionless cloud concept, the software, the
            <strong>application</strong>, the <strong>&AElig;ternity blockchain</strong> and the other blockchain technology related elements may be exposed to hacker attacks or
            other harmful individuals. These actions could result including but not limited to theft or loss of <strong>&AElig;</strong><strong> tokens</strong>.
          </li>
          <li>
            <u>Risk of mining attacks</u>: <strong>USERS</strong> understand and accept that due to <strong>the application&rsquo;s</strong> blockchain based system, it may be
            susceptible to mining attacks, including but not limited to double-spend attacks, majority mining power attacks, 'selfish-mining' attacks, and race condition attacks. Any
            of the above-mentioned attacks could for example result in disturbance of the transactions on the <strong>application</strong>.
          </li>
        </ul>
        <p>
          <u>Risk of phishing attacks and <strong>forks</strong>:</u> <strong>USERS</strong> understand and accept that the <strong>application</strong> can be an object of phishing
          attacks. Highly possible results are the steal of data and credentials. The phishing attacks represent masquerade of an attacker as an authentic and trusted entity and the
          creation of an <strong>application</strong>/ <strong>website</strong> with high percentage of resemblance with the original one. <strong>USERS</strong> should be careful
          when they download and use the original <strong>application</strong>. <strong>USERS</strong> can identity the authentic <strong>Wallet</strong> by verifying that the
          developer on the marketplace is <strong>Superhero.com / Superhero.com LVC</strong> and can use the hyperlinks for downloading, incorporated in the present Terms. Due to the
          fact <strong>&AElig;ternity blockchain</strong> is public and permissionless, any person has the possibility to create a &ldquo;<strong>fork</strong>&rdquo;. Any developer
          can copy and develop the source code resulting in the formation of a distinct and separate software. <strong>USERS</strong> understand and accept that
          <strong>Superhero</strong> cannot avoid the creation of such <strong>forks</strong> and is not responsible for them. <strong>Superhero</strong> shall not be held liable for
          any losses and/or damages resulted from the use of <strong>forks</strong>.
        </p>
      </div>

      <div v-if="index == 5" class="accordion-item-content" v-show="item.open" data-cy="accordion-item-content">
        <p>
          The <strong>Wallet</strong> does not collect any fees or taxes for its use <strong>application </strong>- it is free of charge. However, taxes and fees are payable for the
          transactions on the <strong>&AElig;ternity </strong><strong>blockchain</strong> including but not limited to miner fees, gas tax, transaction fee. The amounts of the taxes
          and fees are fixed unilaterally.
        </p>
        <p>
          In addition, depending on the territory access point, the transfer and receipt of funds through the <strong>application</strong> may be an object of tax and fee payments to
          public authorities in different countries depending on the legal regulations. <strong>USERS</strong> are obliged to inform themselves about such requirements and are solely
          responsible for their donations.
        </p>
      </div>

      <div v-if="index == 6" class="accordion-item-content" v-show="item.open" data-cy="accordion-item-content">
        <p>
          For its purpose, the <strong>Wallet extension</strong> automatically detects the URL on the <strong>USER&rsquo;s</strong> active tab. To send someone a tip, please make
          sure that <strong>YOU</strong> are no the URL that <strong>YOU</strong> want to tip. <strong>Superhero</strong> does not participate or control in any way the tips and
          shall not be held liable for any mistakes and wrong donations. The tips cannot be sent back. Please bear in mind that the <strong>application</strong> is created in order
          for people to stimulate the full, transparent, useful and accurate information worldwide. Therefore, <strong>USERS</strong> shall be fully liable for any use of the
          <strong>Wallet</strong> in violation of its purpose and the present <strong>TERMS</strong>. <strong>Superhero</strong> does not control the platforms the donations are sent
          to. <strong>Superhero</strong> is not responsible for the content on the third-party platforms in any way.
        </p>
        <p>&nbsp;</p>
        <p>
          In addition, any use of third-party platforms for the purpose of exchanging <strong>&AElig;</strong> <strong>tokens</strong> with other cryptocurrencies or fiat currencies
          is subject to compliance with the third-party platform&rsquo;s Terms of use and other compulsory documentation. It is solely your responsibility to comply duly with the
          rules, applicable for these platforms. <strong>Superhero</strong> is not responsible in any way for the use of these third-party platforms in relation to loading the
          <strong>USERS&rsquo;</strong> wallets and the withdrawal of <strong>&AElig;</strong> <strong>tokens</strong>.
        </p>
      </div>

      <div v-if="index == 7" class="accordion-item-content" v-show="item.open" data-cy="accordion-item-content">
        <p>
          The <strong>application</strong> is developed under the open-source, permissive free software ISC License (&ldquo;ISC&rdquo;). Under this license other developers have the
          right to use, copy, modify and distribute the source code of the <strong>Wallet</strong> for any purpose without a fee. The license only requires preservation of the
          copyright and license notice below. <strong>Superhero</strong> is not liable in any way for the diffusion and public access to the amended/modified by other developers
          source code files due to the open source character of the software.
        </p>
        <p>&nbsp;</p>
        <p>The notice is as it follows:</p>
        <p>&nbsp;</p>
        <p>&ldquo;ISC License</p>
        <p>Copyright (c) 2019, SuperHero</p>
        <p>
          Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this
          permission notice appear in all copies.
        </p>
        <p>
          THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO
          EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER
          IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.&rdquo;
        </p>
      </div>

      <div v-if="index == 8" class="accordion-item-content" v-show="item.open" data-cy="accordion-item-content">
        <p>
          The <strong>application</strong> is developed by <strong>Superhero. </strong>The <strong>application</strong> may display or include elements which are subject of
          intellectual property regulation including but not limited to logos, trademarks, domain names, etc. &nbsp;It is prohibited to use any intellectual property of
          <strong>Superhero</strong> before a prior explicit consent from the latter.
        </p>
        <p>&nbsp;</p>
        <p>
          None of the elements mentioned above can be edited, downloaded, reproduced, used for commercial purposes, distributed and transmitted in any manner and/or any medium
          whatsoever, partially or in whole, without the explicit prior written consent of <strong>Superhero</strong>.
        </p>
        <p>&nbsp;</p>
        <p><strong>Superhero</strong> reserves its right to take any necessary legal action against intellectual property infringement.</p>
        <p>&nbsp;</p>
        <p>
          The present article does not in any way exclude or interfere with the rights granted according to article 8- <strong><u>LICENSE</u></strong
          >, of the present Terms.
        </p>
      </div>

      <div v-if="index == 9" class="accordion-item-content" v-show="item.open" data-cy="accordion-item-content">
        <p>
          <strong>USERS</strong> understand and accept <strong>the application</strong> can be periodically modified, updated, maintained or technically supported, which could to
          some extent influence the use of the <strong>Wallet</strong>, the visual representation of the <strong>application</strong> or could result in malfunction. In the latter
          case, if <strong>YOU</strong> as a <strong>USER</strong> notice any change in the <strong>tokens</strong>, settings, accounts or any other information on the application,
          please contact superherowallet@protonmail.com for assistance.
        </p>
      </div>
      <div v-if="index == 10" class="accordion-item-content" v-show="item.open" data-cy="accordion-item-content">
        <p>
          These <strong>TERMS</strong> set forth the entire understanding and agreement as to the subject matter hereof and supersedes any and all prior discussions, agreements, and
          understandings of any kind and every nature between <strong>USERS</strong> and <strong>Superhero</strong>.
        </p>
        <p>&nbsp;</p>
        <p>
          The legislation and jurisdiction of Liechtenstein is applied for the issues outstanding the present <strong>TERMS</strong> without regard to possible conflict of law
          provisions. The invalidity of one or more clauses/ provisions in the <strong>TERMS</strong> does not lead to the invalidity of the whole agreement.
        </p>
        <p>
          <strong><u>The Privacy Policy</u></strong> is an inseparable part of the present <strong>TERMS</strong> and should be considered as a complementary document with compulsory
          character. Unless explicitly stated otherwise in the <strong>Privacy Policy</strong>, all rules from the <strong>TERMS</strong> apply respectively.
        </p>
        <p>&nbsp;</p>
        <p>&nbsp;</p>
        <p>
          For more information regarding our Services and the present <strong>TERMS</strong>, please do not hesitate to contact the <strong>Superhero</strong> team at:
          superherowallet@protonmail.com.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import ArrowDown from '../../../icons/arrow-down.svg?vue-component';
import ArrowRight from '../../../icons/arrow-right.svg?vue-component';

export default {
  components: {
    ArrowDown,
    ArrowRight,
  },
  data() {
    return {
      details: [
        {
          title: this.$t('pages.termsOfService.section1Title'),
          open: false,
        },
        {
          title: this.$t('pages.termsOfService.section2Title'),
          open: false,
        },
        {
          title: this.$t('pages.termsOfService.section3Title'),
          open: false,
        },
        {
          title: this.$t('pages.termsOfService.section4Title'),
          open: false,
        },
        {
          title: this.$t('pages.termsOfService.section5Title'),
          open: false,
        },
        {
          title: this.$t('pages.termsOfService.section6Title'),
          open: false,
        },
        {
          title: this.$t('pages.termsOfService.section7Title'),
          open: false,
        },
        {
          title: this.$t('pages.termsOfService.section8Title'),
          open: false,
        },
        {
          title: this.$t('pages.termsOfService.section9Title'),
          open: false,
        },
        {
          title: this.$t('pages.termsOfService.section10Title'),
          open: false,
        },
        {
          title: this.$t('pages.termsOfService.section11Title'),
          open: false,
        },
      ],
    };
  },
  methods: {
    toggleAccordionItem(index) {
      this.details[index].open = !this.details[index].open;
    },
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';
.terms {
  font-weight: 100;
}
.terms--heading {
  margin: 20px;
  text-align: center;
}
.accordion-item-title {
  color: $accent-color;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  .icon {
    width: 25px;
    margin-top: 4px;
  }
  span {
    margin-right: auto;
    color: $accent-color;
  }
}
.accordion-item-content {
  font-size: 14px;
  font-weight: 100;
}
</style>
