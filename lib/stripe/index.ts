import Stripe from "stripe";
import { serverEnv } from "@/lib/env/server";

const secretKey = serverEnv.STRIPE_SECRET_KEY;
if (!secretKey || secretKey.trim() === "") {
  throw new Error("Missing STRIPE_SECRET_KEY in environment variables");
}

const stripe = new Stripe(secretKey);

export default stripe;
