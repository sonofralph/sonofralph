import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.ALERT_EMAIL_FROM ?? "alerts@stockwise.app";

export interface AlertEmailPayload {
  to: string[];
  itemName: string;
  locationName: string;
  type: "LOW_STOCK" | "OUT_OF_STOCK";
  quantity: number;
  unit: string;
  orgName: string;
}

export async function sendAlertEmail(payload: AlertEmailPayload) {
  if (!resend || payload.to.length === 0) return;

  const isOut = payload.type === "OUT_OF_STOCK";
  const subject = isOut
    ? `[Stockwise] Out of stock: ${payload.itemName}`
    : `[Stockwise] Low stock warning: ${payload.itemName}`;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <div style="background:${isOut ? "#fee2e2" : "#fef3c7"};border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;font-size:14px;font-weight:600;color:${isOut ? "#b91c1c" : "#92400e"}">
          ${isOut ? "⚠️ Out of Stock" : "🔔 Low Stock Warning"}
        </p>
      </div>
      <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a">${payload.itemName}</h2>
      <p style="margin:0 0 20px;color:#64748b;font-size:14px">
        ${payload.orgName} · ${payload.locationName}
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr>
          <td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Current quantity</td>
          <td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">
            ${payload.quantity} ${payload.unit}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b">Location</td>
          <td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right">${payload.locationName}</td>
        </tr>
      </table>
      <div style="margin-top:28px">
        <a href="${process.env.NEXTAUTH_URL ?? "http://localhost:3001"}/alerts"
           style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">
          View Alerts
        </a>
      </div>
      <p style="margin-top:32px;font-size:12px;color:#94a3b8">
        You are receiving this because you are an admin of ${payload.orgName} on Stockwise.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({ from: FROM, to: payload.to, subject, html });
  } catch {
    // Email is non-critical — log and continue
    console.error("[email] Failed to send alert email");
  }
}
