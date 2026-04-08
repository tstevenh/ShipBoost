import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { dash } from "@better-auth/infra";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "../server/db/client";
import {
  sendPasswordResetConfirmationEmail,
  sendPasswordResetEmailMessage,
  sendVerificationEmailMessage,
  sendWelcomeEmailMessage,
} from "../server/email/transactional";
import { getEnv } from "../server/env";

const env = getEnv();
const plugins: BetterAuthPlugin[] = [nextCookies()];

if (env.BETTER_AUTH_API_KEY) {
  plugins.push(
    dash({
      apiKey: env.BETTER_AUTH_API_KEY,
    }),
  );
}

export const auth = betterAuth({
  appName: "Shipboost",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmailMessage({
        to: user.email,
        name: user.name,
        resetUrl: url,
      });
    },
    onPasswordReset: async ({ user }) => {
      await sendPasswordResetConfirmationEmail({
        to: user.email,
        name: user.name,
        signInUrl: `${env.NEXT_PUBLIC_APP_URL}/sign-in?reset=1`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmailMessage({
        to: user.email,
        name: user.name,
        verificationUrl: url,
      });
    },
    afterEmailVerification: async (user) => {
      await sendWelcomeEmailMessage({
        to: user.email,
        name: user.name,
        dashboardUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
      });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false,
        defaultValue: "FOUNDER",
      },
      bio: {
        type: "string",
        required: false,
      },
      xUrl: {
        type: "string",
        required: false,
      },
      githubUrl: {
        type: "string",
        required: false,
      },
      linkedinUrl: {
        type: "string",
        required: false,
      },
      facebookUrl: {
        type: "string",
        required: false,
      },
    },
  },
  plugins,
});

export type AuthSession = typeof auth.$Infer.Session;
