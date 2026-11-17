import { Tag } from '@aeternity/aepp-sdk';
import { lowerFirst } from 'lodash-es';
import {
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_ACCOUNT_LIST,
  POPUP_TYPE_NETWORK_SWITCH,
} from '../../../src/constants';
import { STUB_POPUP_PROPS, STUB_TX_PARAMS } from '../../../src/constants/stubs';
import locale from '../../../src/popup/locales/en-US.json';

const popups = [
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_ACCOUNT_LIST,
  POPUP_TYPE_NETWORK_SWITCH,
];

const txTags = [
  Tag.SpendTx,
  Tag.ContractCallTx,
  Tag.ContractCreateTx,
];

describe('Tests cases for AEX-2 popups', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Sign Message popup, Connect, Account list, Raw Sign display correct data', () => {
    const props = STUB_POPUP_PROPS[POPUP_TYPE_MESSAGE_SIGN];
    cy.openAex2Popup(POPUP_TYPE_MESSAGE_SIGN)
      .get('[data-cy=aepp]')
      .should('be.visible')
      .should('contain', props.app.name)
      .should('contain', props.app.host)
      .get('[data-cy=message]')
      .should('be.visible')
      .should('contain', props.message);

    const props1 = STUB_POPUP_PROPS[POPUP_TYPE_CONNECT];
    cy.openAex2Popup(POPUP_TYPE_CONNECT)
      .get('[data-cy=aepp]')
      .should('be.visible')
      .should('contain', props1.app.name)
      .should('contain', props1.app.host);

    const props2 = STUB_POPUP_PROPS[POPUP_TYPE_RAW_SIGN];
    cy.openAex2Popup(POPUP_TYPE_RAW_SIGN)
      .get('[data-cy=warning]')
      .should('be.visible')
      .get('[data-cy=sender]')
      .should('be.visible')
      .should('contain', props2.app.host)
      .get('[data-cy=data]')
      .should('be.visible')
      .should('contain', props2.txBase64);

    const props3 = STUB_POPUP_PROPS[POPUP_TYPE_ACCOUNT_LIST];
    cy.openAex2Popup(POPUP_TYPE_ACCOUNT_LIST)
      .get('[data-cy=aepp]')
      .should('be.visible')
      .should('contain', props3.app.name)
      .should('contain', props3.app.host);
  });

  // #3678: the badge left a 2px strip of the account card showing
  it('Connect popup network badge reaches the account card edge', () => {
    cy.openAex2Popup(POPUP_TYPE_CONNECT)
      .get('[data-cy=popup-aex2] .account-select-input .option-wrapper')
      .then(([card]) => {
        cy.get('[data-cy=popup-aex2] .network-button').should(([badge]) => {
          const cardBox = card.getBoundingClientRect();
          const badgeBox = badge.getBoundingClientRect();
          expect(badgeBox.right).to.be.closeTo(cardBox.right, 0.5);
          expect(badgeBox.top).to.be.closeTo(cardBox.top, 0.5);
          expect(badgeBox.bottom).to.be.closeTo(cardBox.bottom, 0.5);
          expect(badge.scrollWidth, 'network name fits').to.be.at.most(badge.clientWidth);
        });
      });
  });

  it('Network switch popup displays the requesting site and the target network', () => {
    const props = STUB_POPUP_PROPS[POPUP_TYPE_NETWORK_SWITCH];
    cy.openAex2Popup(POPUP_TYPE_NETWORK_SWITCH)
      .get('[data-cy=aepp]')
      .should('be.visible')
      .should('contain', props.app.href)
      .get('[data-cy=new-network-warning]')
      .should('be.visible')
      .get('[data-cy=network-name]')
      .should('contain', props.networkName)
      .get('[data-cy=network-id]')
      .should('contain', props.networkId)
      .get('[data-cy=node-url]')
      .should('contain', props.nodeUrl);
  });

  it('Opens connectConfirm, sign, messageSign popups and send accept/deny action', () => {
    popups.forEach((popup) => {
      cy.openAex2Popup(popup, popup === POPUP_TYPE_SIGN && Tag[Tag.SpendTx])
        .get('[data-cy=deny]')
        .click()
        .window()
        .should((win) => {
          expect(win.reject).to.equal('send');
        });
    });

    popups.forEach((popup) => {
      cy.openAex2Popup(popup, popup === POPUP_TYPE_SIGN && Tag[Tag.SpendTx])
        .get('[data-cy=accept]')
        .click()
        .window()
        .should((win) => {
          expect(win.resolve).to.equal('send');
        });
    });
  });

  txTags.forEach((txTag) => {
    it(`Sign Popup display correct ${Tag[txTag]} data`, () => {
      const tx = STUB_TX_PARAMS[Tag[txTag]];
      const amount = tx.amount / 10 ** 18;
      const fee = tx.fee / 10 ** 18;
      let receiver;
      if (txTag === Tag.SpendTx) {
        receiver = tx.recipientId;
      } else if (txTag === Tag.ContractCallTx) {
        receiver = tx.contractId;
      } else {
        receiver = 'Contract create';
      }
      cy.openAex2Popup(POPUP_TYPE_SIGN, Tag[txTag])
        .get('[data-cy=label]')
        .should('be.visible')
        .should('contain', locale.transaction.type[lowerFirst(Tag[txTag])]);

      if (txTag !== Tag.ContractCreateTx) {
        cy.splittedStringToBeEqual('[data-cy=recipient] [data-cy=address]', receiver);
      } else {
        cy.get('[data-cy=recipient]').should('be.visible').should('contain', receiver);
      }

      cy.get('[data-cy=fee]')
        .should('be.visible')
        .should('contain', fee.toFixed(2))
        .get('[data-cy=total]')
        .should('be.visible')
        .should('contain', parseFloat(amount + fee).toFixed(2));
    });
  });
});
