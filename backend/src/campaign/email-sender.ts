import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  from: string;
}

export interface EmailSender {
  sendEmail(input: SendEmailInput): Promise<void>;
}

export class SesEmailSender implements EmailSender {
  constructor(private readonly client: SESClient = new SESClient({})) {}

  async sendEmail(input: SendEmailInput): Promise<void> {
    await this.client.send(
      new SendEmailCommand({
        Source: input.from,
        Destination: { ToAddresses: [input.to] },
        Message: {
          Subject: { Data: input.subject },
          Body: { Text: { Data: input.body } },
        },
      })
    );
  }
}

export const sesEmailSender = new SesEmailSender();
