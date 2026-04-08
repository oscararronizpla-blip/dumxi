import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function issueRefund(paymentIntentId: string) {
  try {
    await stripe.refunds.create({ payment_intent: paymentIntentId })
  } catch (err) {
    console.error("Refund failed:", err)
  }
}
