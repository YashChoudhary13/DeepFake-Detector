# app/payments.py
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import stripe

router = APIRouter()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")  # Set in your env

class CreateCheckoutRequest(BaseModel):
    plan: str  # e.g., "pro_monthly" or "pro_yearly"
    # optionally include user_id/email for metadata

# Simple plan-to-price mapping (use Stripe Price IDs in production)
PLAN_PRICE_MAP = {
    "pro_monthly": {
        "name": "DeepVerify Pro (Monthly)",
        "amount": 1900,    # cents
        "currency": "usd",
    },
    "pro_yearly": {
        "name": "DeepVerify Pro (Yearly)",
        "amount": 17900,
        "currency": "usd",
    },
}

@router.post("/create-checkout-session")
async def create_checkout_session(payload: CreateCheckoutRequest):
    plan = payload.plan
    if plan not in PLAN_PRICE_MAP:
        raise HTTPException(status_code=400, detail="Unknown plan")

    plan_info = PLAN_PRICE_MAP[plan]

    try:
        # Create a Checkout Session:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": plan_info["currency"],
                        "product_data": {"name": plan_info["name"]},
                        "unit_amount": plan_info["amount"],
                    },
                    "quantity": 1,
                }
            ],
            success_url=os.getenv("FRONTEND_URL", "http://localhost:3000") + "/?checkout=success",
            cancel_url=os.getenv("FRONTEND_URL", "http://localhost:3000") + "/membership?checkout=cancel",
            # optional: attach metadata or customer email
            # metadata={"plan": plan},
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
