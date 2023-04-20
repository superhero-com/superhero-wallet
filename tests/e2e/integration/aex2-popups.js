import { SCHEMA } from '@aeternity/aepp-sdk';
import {
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
} from '../../../src/popup/utils';
import { popupProps, txParams } from '../../../src/popup/utils/testsConfig';
import locale from '../../../src/popup/locales/en.json';

const popups = [POPUP_TYPE_CONNECT, POPUP_TYPE_SIGN, POPUP_TYPE_MESSAGE_SIGN];

const txTypes = [
  SCHEMA.TX_TYPE.spend,
  SCHEMA.TX_TYPE.contractCall,
  SCHEMA.TX_TYPE.contractCreate,
];

describe('Tests cases for AEX-2 popups', () => {
  beforeEach(() => {
    cy.login();
  });

  it('Sign Message popup, Connect, Raw Sign display correct data', () => {
    const props = popupProps[POPUP_TYPE_MESSAGE_SIGN];
    cy.openAex2Popup(POPUP_TYPE_MESSAGE_SIGN)
      .get('[data-cy=aepp]')
      .should('be.visible')
      .should('contain', props.app.name)
      .should('contain', props.app.host)
      .get('[data-cy=message]')
      .should('be.visible')
      .should('contain', props.message);

    const props1 = popupProps[POPUP_TYPE_CONNECT];
    cy.openAex2Popup(POPUP_TYPE_CONNECT)
      .get('[data-cy=aepp]')
      .should('be.visible')
      .should('contain', props1.app.name)
      .should('contain', props1.app.host);

    const props2 = popupProps[POPUP_TYPE_RAW_SIGN];
    cy.openAex2Popup(POPUP_TYPE_RAW_SIGN)
      .get('[data-cy=warning]')
      .should('be.visible')
      .get('[data-cy=data]')
      .should('be.visible')
      .should('contain', props2.data)
      .get('[data-cy=sender]')
      .should('be.visible')
      .should('contain', props2.app.host);
  });

  it('Opens connectConfirm, sign, messageSign popups and send accept/deny action', () => {
    popups.forEach((popup) => {
      cy.openAex2Popup(popup, popup === 'sign' && SCHEMA.TX_TYPE.spend)
        .get('[data-cy=deny]')
        .click()
        .window()
        .should((win) => {
          expect(win.reject).to.equal('send');
        });
    });

    popups.forEach((popup) => {
      cy.openAex2Popup(popup, popup === 'sign' && SCHEMA.TX_TYPE.spend)
        .get('[data-cy=accept]')
        .click()
        .window()
        .should((win) => {
          expect(win.resolve).to.equal('send');
        });
    });
  });

  txTypes.forEach((txType) => {
    it(`Sign Popup display correct ${txType} data`, () => {
      const tx = txParams[txType];
      const amount = tx.amount / 10 ** 18;
      const fee = tx.fee / 10 ** 18;
      let receiver;
      if (txType === SCHEMA.TX_TYPE.spend) {
        receiver = tx.recipientId;
      } else if (txType === SCHEMA.TX_TYPE.contractCall) {
        receiver = tx.contractId;
      } else {
        receiver = 'Contract create';
      }
      cy.openAex2Popup('sign', txType)
        .get('[data-cy=label]')
        .should('be.visible')
        .should('contain', locale.transaction.type[txType]);

      if (txType !== SCHEMA.TX_TYPE.contractCreate) {
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
