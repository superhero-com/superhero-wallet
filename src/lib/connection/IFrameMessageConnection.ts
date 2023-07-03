import { BrowserWindowMessageConnection } from '@aeternity/aepp-sdk-13';

export class IFrameMessageConnection extends BrowserWindowMessageConnection {
  target: any;

  // constructor(args: any) {
  //   const { target, ...options } = args;
  //   super(options);
  //   this.target = target;
  //   console.info('========================');
  //   console.info('IFrameMessageConnection.constructor target::', target);
  //   console.info('========================');
  // }

  connect(
    onMessage: (
      message: any,
      origin: string,
      source: MessageEventSource | null
    ) => void,
    onDisconnect: () => void,
  ): void {
    super.connect(onMessage, onDisconnect);
    console.info('========================');
    console.info('IFrameMessageConnection.connect onMessage::', this);
    console.info('========================');
    this.listener = (event: MessageEvent) => {
      console.info('========================');
      console.info('on listener message event ::', event);
      console.info('========================');
    };
  }

  protected receiveMessage(message: any): void {
    console.info('========================');
    console.info('receiveMessage ::', message);
    console.info('========================');
    super.receiveMessage(message);
  }

  sendMessage(msg: any): void {
    super.sendMessage(msg);
    // eslint-disable-next-line no-unused-expressions
    // this.target?.postMessage(msg, '*');
    console.info('========================');
    console.info('IFMC sendMessage ::', msg);
    console.info('========================');
  }
}
