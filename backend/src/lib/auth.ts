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
          text : `Hi ${user.name},

Welcome to RedAid. Please verify your email address to activate your account:

${verificationUrl}

This link will expire in 24 hours. If you didn't create a RedAid account, you can safely ignore this email.

— The RedAid Team`,        
         html: `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#F8F7F6; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F7F6; padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF; border:1px solid #E6E2DF; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="background-color:#8A1C1C; padding:24px 32px;">
                <span style="color:#FFFFFF; font-size:20px; font-weight:700;">RedAid</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px; color:#1F1B1A; font-size:16px; line-height:24px;">
                  Hi ${user.name},
                </p>
                <p style="margin:0 0 24px; color:#1F1B1A; font-size:16px; line-height:24px;">
                  Welcome to RedAid. Please verify your email address to activate your account and start connecting with donors and blood banks near you.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:10px; background-color:#8A1C1C;">
                      <a href="${verificationUrl}" target="_blank" style="display:inline-block; padding:12px 28px; color:#FFFFFF; font-size:15px; font-weight:600; text-decoration:none;">
                        Verify Email Address
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0; color:#6B6360; font-size:13px; line-height:20px;">
                  This link expires in 24 hours. If the button doesn't work, copy and paste this URL into your browser:
                </p>
                <p style="margin:8px 0 0; word-break:break-all;">
                  <a href="${verificationUrl}" style="color:#8A1C1C; font-size:13px;">${verificationUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px; border-top:1px solid #E6E2DF;">
                <p style="margin:0; color:#6B6360; font-size:12px; line-height:18px;">
                  If you didn't create a RedAid account, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`       
      });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      } catch (err) {
        console.error("Error while sending mail:", err);
      }
    },
  },
});
