import { Router } from "express"
import express from "express"
import { stripeWebhookController } from "./stripe.webhook.controller.js"

const router = Router()

router.post(
  "/webhook",
  express.raw({
    type: "application/json"
  }),
  stripeWebhookController
)

export default router