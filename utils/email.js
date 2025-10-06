import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT) || 587,
	secure: Boolean(process.env.SMTP_SECURE) || false,
	auth: process.env.SMTP_USER ? {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	} : undefined,
});

export async function sendVerificationEmail(to, code) {
	// If no SMTP configured, just log the code
	if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
		console.log(`\n📧 Verification code for ${to}: ${code}\n`);
		return { messageId: 'console-log' };
	}
	
	const mail = {
		from: process.env.MAIL_FROM || 'no-reply@molar-match.app',
		to,
		subject: 'Verify your email',
		text: `Your verification code is ${code}`,
		html: `<p>Your verification code is <b>${code}</b></p>`,
	};
	
	try {
		return await transporter.sendMail(mail);
	} catch (error) {
		console.log(`\n📧 Email failed, verification code for ${to}: ${code}\n`);
		throw error;
	}
}


