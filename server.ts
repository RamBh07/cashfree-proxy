import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());




// ✅ Use sandbox or production based on environment
const CF_BASE =
  process.env.NODE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const CF_API_VERSION = "2022-09-01"; // Recommended stable API version

// ✅ Never expose EXPO_PUBLIC_ vars in your server
const CF_APP_ID = process.env.CASHFREE_APP_ID!;
const CF_SECRET = process.env.CASHFREE_SECRET!;
const PORT = process.env.PORT || 3001;

// 🧾 Types for clarity
interface CashfreeOrderResponse {
  order_id: string;
  payment_session_id: string;
  [key: string]: any;
}

interface CreateOrderBody {
  orderId: string;
  amount: number;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

// 🧠 Route: Create Cashfree Order
app.post("/create-order", async (req: express.Request , res: express.Response) => {
  try {
    const { orderId, amount, customer } = req.body as CreateOrderBody;

    const payload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
      },
      order_meta: {
        return_url: "shopymart://payments/cashfree-return?order_id={order_id}",
        notify_url:
          "https://orthostyle-untranscended-nila.ngrok-free.dev/cashfree-webhook",
      },
    };

    console.log("➡️ Creating Cashfree order...");

    const response = await fetch(`${CF_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CF_APP_ID,
        "x-client-secret": CF_SECRET,
        "x-api-version": CF_API_VERSION,
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as Partial<CashfreeOrderResponse>;

    console.log("🔵 Cashfree response:", data);

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    if (!data.order_id || !data.payment_session_id) {
      throw new Error("Invalid Cashfree response");
    }

    res.json({
      order_id: data.order_id,
      payment_session_id: data.payment_session_id,
    });
  } catch (error) {
    console.error("❌ Error creating Cashfree order:", error);
    res.status(500).json({ error: "Failed to create Cashfree order" });
  }
});

// 🪝 Optional Webhook endpoint
app.post("/cashfree-webhook", (req: express.Request, res: express.Response) => {
  console.log("🔔 Webhook received:", req.body);
  res.sendStatus(200);
});

// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`✅ Cashfree Server running on port ${PORT}`);
});
