interface Content {
  text: string;
  channel: string;
}
interface CabalMessage {
  channel: string;
  author: {
    key: string;
    name: string;
    local: boolean;
    online: boolean;
  };
  message: {
    key: string;
    seq: number;
    directMention: boolean;
    value: {
      type: string;
      timestamp: number;
      content: Content;
    };
  };
}

interface CabalEventCallback {
  (info: any): void;
}

interface CabalDetails {
  joinChannel(channel: string): void;
  getChannels(): string[];
  publishMessage(message: {
    type: string;
    content: {
      text: string;
      channel: string;
    };
  }): void;
  on(event: string, cb: CabalEventCallback): void;
}

interface AddCabalCallback {
  (): void;
}

// TODO: there are messages that have different structure like 'status/date-changed'
interface CabalMessage {
  key: string;
  seq: number;
  value: {
    timestamp: number;
    type: string;
    content: Content;
  };
}

interface Client {
  addCabal(key: string, cb: AddCabalCallback): Promise<CabalDetails>;
  getMessages(info: {
    newerThan: number | undefined;
    amount: number | undefined;
  }): Promise<CabalMessage[]>;
}