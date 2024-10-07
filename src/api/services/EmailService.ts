import nodeMailerLib from "nodemailer";

interface IEmailService {
  sendEmail: (params: ISendEmail) => Promise<any>;
}
interface ISendEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

const user = process.env.MAILTRAP_USERNAME;
const pass = process.env.MAILTRAP_PASSWORD;

export class EmailService implements IEmailService {
  constructor() {
    if (!this.nodeMailer) {
      this.nodeMailer = nodeMailerLib.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user,
          pass,
        },
      });
    }
  }
  nodeMailer: any;
  sendEmail = async (params: ISendEmail): Promise<any> => {
    return this.nodeMailer.sendMail(params);
  };
}
