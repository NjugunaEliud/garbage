/** M-Pesa / Daraja API helpers */

const DARAJA_BASE =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

async function getAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY!;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );

  const res = await fetch(
    `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    throw new Error(
      `Failed to obtain M-Pesa access token: ${res.status} – ${body}`
    );
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export interface StkPushParams {
  phone: string;    // format: 2547XXXXXXXX
  amount: number;
  accountRef: string;
  description: string;
}

export interface StkPushResult {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export async function initiateStkPush(
  params: StkPushParams
): Promise<StkPushResult> {
  const accessToken = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  const callbackUrl = process.env.MPESA_CALLBACK_URL!;

  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
    "base64"
  );

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.ceil(params.amount),
    PartyA: params.phone,
    PartyB: shortcode,
    PhoneNumber: params.phone,
    CallBackURL: callbackUrl,
    AccountReference: params.accountRef,
    TransactionDesc: params.description,
  };

  const res = await fetch(
    `${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`STK Push failed: ${err}`);
  }

  return res.json() as Promise<StkPushResult>;
}

export interface C2BCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value?: string | number }>;
      };
    };
  };
}

export function extractCallbackMeta(body: C2BCallbackBody) {
  const items = body.Body.stkCallback.CallbackMetadata?.Item ?? [];
  const get = (name: string) =>
    items.find((i) => i.Name === name)?.Value ?? null;

  return {
    resultCode: body.Body.stkCallback.ResultCode,
    resultDesc: body.Body.stkCallback.ResultDesc,
    amount: get("Amount") as number | null,
    mpesaReference: get("MpesaReceiptNumber") as string | null,
    phone: get("PhoneNumber") as string | null,
    transactionDate: get("TransactionDate") as string | null,
  };
}
