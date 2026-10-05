import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { Roles } from "../types/constant/role";
import { BloodType } from "../types/constant/bloodType";
import { UserStatus } from "../types/constant/userStatus";
import nodemailer from "nodemailer";
import config from "../config";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, 
  auth: {
    user: config.app_email,
    pass: config.app_pass,
  },
});


export const auth = betterAuth({
  baseURL: config.backend_url,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [config.frontend_url, config.backend_url],
  advanced: {
    cookiePrefix: "RedAid",
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
  },
  user: {
    additionalFields: {
      role: {
        type: Object.values(Roles),
        defaultValue: Roles.USER,
        required: false,
      },
      bloodType: {
        type: Object.values(BloodType),
        required: true,
      },
      status: {
        type: Object.values(UserStatus),
        defaultValue: UserStatus.ACTIVE,
        required: false,
      },
      lastDonationDate: {
        type: "date",
        required: true,
      },
      phone: {
        type: "string",
        required: true,
      },
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      // const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      const verificationUrl = url.replace(
        "callbackURL=%2F",
        `callbackURL=${encodeURIComponent(config.frontend_url)}`,
      );
      console.log(verificationUrl);
      try {
        const info = await transporter.sendMail({
          from: '"Red Aid" <service@redaid.com>',
          to: `${user.email}`,
          subject: "Verify your email address • RED AID",
          text: `Please verify your email address by clicking the link: ${verificationUrl}`,
          html: `<p>Please verify your email address by clicking the link: <a href="${verificationUrl}">Verify Email</a></p>`,
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      } catch (err) {
        console.error("Error while sending mail:", err);
      }
    },
  },
});
