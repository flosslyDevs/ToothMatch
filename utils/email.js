import nodemailer from 'nodemailer';
import { logger as loggerRoot } from './logger.js';
const loggerBase = loggerRoot.child('utils/email.js');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Boolean(process.env.SMTP_SECURE) || false,
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

export async function sendVerificationEmail(to, code) {
  const logger = loggerBase.child('sendVerificationEmail');
  logger.debug('Sending verification email', { to, code });
  // If no SMTP configured, just log the code
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    logger.warn(`No SMTP configured, skipping email send`);
    return;
  }

  const mail = {
    from: process.env.MAIL_FROM || 'no-reply@molar-match.app',
    to,
    subject: 'Verify your email',
    text: `Your verification code is ${code}`,
    html: `<p>Your verification code is <b>${code}</b></p>`,
  };

  logger.debug('Sending email', { mail });

  try {
    const res = await transporter.sendMail(mail);
    logger.info('Email sent');
    return res;
  } catch (error) {
    logger.error(`Email failed`, { error: error.message }, error);

    // Provide helpful error message for Gmail 2FA issues
    if (error.message && error.message.includes('BadCredentials')) {
      const helpfulError = new Error(
        'Gmail authentication failed. With 2FA enabled, you must use an App Password instead of your regular password. Go to: https://myaccount.google.com/apppasswords'
      );
      helpfulError.code = 'SMTP_AUTH_FAILED';
      throw helpfulError;
    }
  }
}
