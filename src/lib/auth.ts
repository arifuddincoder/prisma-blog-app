import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";
// import { PrismaClient } from "../../generated/prisma/client";
// If your Prisma file is located elsewhere, you can change the path

const transporter = nodemailer.createTransport({
	host: "sandbox.smtp.mailtrap.io",
	port: 2525,
	secure: false, // Use true for port 465, false for port 587
	auth: {
		user: process.env.APP_USER,
		pass: process.env.APP_PASS,
	},
});

// const prisma = new PrismaClient();
export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql", // or "mysql", "postgresql", ...etc
	}),
	trustedOrigins: [process.env.APP_URL || "http://localhost:4000"],
	user: {
		additionalFields: {
			role: {
				type: "string",
				defaultValue: "USER",
				required: false,
			},
			phone: {
				type: "string",
				required: false,
			},
			status: {
				type: "string",
				defaultValue: "ACTIVE",
				required: false,
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		autoSignIn: false,
		requireEmailVerification: true,
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url, token }, request) => {
			try {
				const info = await transporter.sendMail({
					from: '"Prisma Blog" <prismablog@ph.com>',
					to: user.email,
					subject: "Verify your email address – Prisma Blog",
					text: `
Hello ${user.name || "there"},

Welcome to Prisma Blog!

Please verify your email address by clicking the link below:
${url}

If you did not create this account, you can safely ignore this email.

– Prisma Blog Team
      `,
					html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Welcome to Prisma Blog 👋</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>Thanks for creating an account. Please verify your email address by clicking the button below:</p>

          <p style="margin: 20px 0;">
            <a href="${url}"
               style="
                 background-color: #4f46e5;
                 color: #ffffff;
                 padding: 12px 20px;
                 text-decoration: none;
                 border-radius: 6px;
                 display: inline-block;
               ">
              Verify Email
            </a>
          </p>

          <p>If you didn’t create an account with Prisma Blog, you can safely ignore this email.</p>

          <p style="margin-top: 30px;">
            Regards,<br />
            <strong>Prisma Blog Team</strong>
          </p>
        </div>
      `,
				});

				console.log("Verification email sent:", info.messageId);
			} catch (err) {
				console.log(err);
				throw err;
			}
		},
	},

	socialProviders: {
		google: {
			prompt: "select_account consent",
			accessType: "offline",
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
});
