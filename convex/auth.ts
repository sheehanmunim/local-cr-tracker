import { createClient } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import type { GenericCtx } from "@convex-dev/better-auth";
import { betterAuth } from "better-auth";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

const localOrigin = "http://localhost:3000";
const localIpOrigin = "http://127.0.0.1:3000";

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? localOrigin,
    trustedOrigins: [
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
      localOrigin,
      localIpOrigin,
    ].filter((origin): origin is string => Boolean(origin)),
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
    plugins: [convex({ authConfig })],
    rateLimit: {
      storage: "database",
    },
  });

export const { getAuthUser } = authComponent.clientApi();
