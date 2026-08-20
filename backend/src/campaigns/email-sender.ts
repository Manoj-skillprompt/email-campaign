import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  body: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

export class MockEmailSender implements EmailSender {
  readonly sentMessages: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sentMessages.push(message);
  }
}

export class SesEmailSender implements EmailSender {
  private readonly client: SESClient;

  constructor(client: SESClient = new SESClient({})) {
    this.client = client;
  }

  async send(message: EmailMessage): Promise<void> {
    await this.client.send(
      new SendEmailCommand({
        Source: message.from,
        Destination: { ToAddresses: [message.to] },
        Message: {
          Subject: { Data: message.subject },
          Body: { Text: { Data: message.body } },
        },
      })
    );
  }
}

export function createEmailSender(): EmailSender {
  const hasAwsCredentials = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  if (!hasAwsCredentials || process.env.NODE_ENV === "test") {
    return new MockEmailSender();
  }
  return new SesEmailSender();
}
