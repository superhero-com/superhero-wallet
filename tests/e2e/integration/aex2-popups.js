import { Tag } from '@aeternity/aepp-sdk';
import { lowerFirst } from 'lodash-es';
import {
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_ACCOUNT_LIST,
} from '../../../src/config';
import { STUB_POPUP_PROPS, STUB_TX_PARAMS } from '../../../src/config/stubs';
import locale from '../../../src/popup/locales/en.json';

const popups = [
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_ACCOUNT_LIST,
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
      .get('[data-cy=data]')
      .should('be.visible')
      .should('contain', props2.data)
      .get('[data-cy=sender]')
      .should('be.visible')
      .should('contain', props2.app.host);

    const props3 = STUB_POPUP_PROPS[POPUP_TYPE_ACCOUNT_LIST];
    cy.openAex2Popup(POPUP_TYPE_ACCOUNT_LIST)
      .get('[data-cy=aepp]')
      .should('be.visible')
      .should('contain', props3.app.name)
      .should('contain', props3.app.host);
  });

  it('Opens connectConfirm, sign, messageSign popups and send accept/deny action', () => {
    popups.forEach((popup) => {
      cy.openAex2Popup(popup, popup === 'sign' && Tag[Tag.SpendTx])
        .get('[data-cy=deny]')
        .click()
        .window()
        .should((win) => {
          expect(win.reject).to.equal('send');
        });
    });

    popups.forEach((popup) => {
      cy.openAex2Popup(popup, popup === 'sign' && Tag[Tag.SpendTx])
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
      cy.openAex2Popup('sign', Tag[txTag])
        .get('[data-cy=label]')
        .should('be.visible')
        .should('contain', locale.transaction.type[lowerFirst(Tag[txTag])]);

      if (txTag !== Tag.ContractCreateTx) {
        cy.get('[data-cy=recipient] [data-cy=address]')
          .should('be.visible')
          .then((recipient) => {
            expect(recipient.text().replaceAll(' ', '')).to.equal(receiver);
          });
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
