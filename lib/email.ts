import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.ALERT_EMAIL_FROM ?? "noreply@mise.app";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3001";

// ─── Shared layout helpers ───────────────────────────────────────────────────

function emailShell(body: string) {
  return `
<div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:24px;background:#f8fafc">
  <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0">
    ${body}
    <p style="margin-top:28px;font-size:11px;color:#94a3b8">
      Mise — Hospitality Inventory Management · <a href="${APP_URL}" style="color:#94a3b8">mise.app</a>
    </p>
  </div>
</div>`;
}

function logoHeader(subtitle: string) {
  return `
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
    <div style="background:#4f46e5;border-radius:8px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <span style="color:#fff;font-size:16px;font-weight:700">M</span>
    </div>
    <div>
      <p style="margin:0;font-size:17px;font-weight:700;color:#0f172a">Mise</p>
      <p style="margin:0;font-size:12px;color:#64748b">${subtitle}</p>
    </div>
  </div>`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AlertEmailPayload {
  to: string[];
  itemName: string;
  locationName: string;
  type: "LOW_STOCK" | "OUT_OF_STOCK";
  quantity: number;
  unit: string;
  orgName: string;
}

export interface DigestPayload {
  to: string[];
  orgName: string;
  totalItems: number;
  lowStockCount: number;
  weekReceipts: number;
  weekIssues: number;
  weekWastageValue: number;
  pendingPOs: number;
  topWasted: { name: string; qty: number; unit: string }[];
  appUrl: string;
}

export interface InviteEmailPayload {
  to: string;
  recipientName: string;
  inviterName: string;
  orgName: string;
  temporaryPassword: string;
}

// ─── Invite / welcome email ───────────────────────────────────────────────────

export async function sendInviteEmail(payload: InviteEmailPayload) {
  if (!resend) return;

  const html = emailShell(`
    ${logoHeader("You've been invited")}
    <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a">Welcome to ${payload.orgName}</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6">
      Hi ${payload.recipientName}, <strong>${payload.inviterName}</strong> has added you to
      <strong>${payload.orgName}</strong> on Mise. Use the credentials below to sign in.
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <p style="margin:0 0 6px;font-size:13px;color:#64748b">Email</p>
      <p style="margin:0 0 14px;font-size:14px;font-weight:600;color:#0f172a">${payload.to}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#64748b">Temporary password</p>
      <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;letter-spacing:0.05em">${payload.temporaryPassword}</p>
    </div>
    <a href="${APP_URL}/login"
       style="display:inline-block;background:#4f46e5;color:#fff;padding:11px 22px;border-radius:7px;text-decoration:none;font-size:14px;font-weight:500">
      Sign in to Mise →
    </a>
    <p style="margin-top:20px;font-size:12px;color:#94a3b8">
      Please change your password after your first sign-in via
      <a href="${APP_URL}/settings/profile" style="color:#6366f1">Settings → Profile</a>.
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject: `You've been added to ${payload.orgName} on Mise`,
      html,
    });
  } catch {
    console.error("[email] Failed to send invite email");
  }
}

// ─── Alert email ─────────────────────────────────────────────────────────────

export async function sendAlertEmail(payload: AlertEmailPayload) {
  if (!resend || payload.to.length === 0) return;

  const isOut = payload.type === "OUT_OF_STOCK";
  const subject = isOut
    ? `[Mise] Out of stock: ${payload.itemName}`
    : `[Mise] Low stock warning: ${payload.itemName}`;

  const html = emailShell(`
    ${logoHeader(payload.orgName)}
    <div style="background:${isOut ? "#fee2e2" : "#fef3c7"};border-radius:8px;padding:14px 18px;margin-bottom:20px">
      <p style="margin:0;font-size:14px;font-weight:600;color:${isOut ? "#b91c1c" : "#92400e"}">
        ${isOut ? "⚠️ Out of Stock" : "🔔 Low Stock Warning"}
      </p>
    </div>
    <h2 style="margin:0 0 6px;font-size:20px;color:#0f172a">${payload.itemName}</h2>
    <p style="margin:0 0 18px;color:#64748b;font-size:14px">${payload.orgName} · ${payload.locationName}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
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
    <a href="${APP_URL}/alerts"
       style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500">
      View Alerts →
    </a>
    <p style="margin-top:20px;font-size:12px;color:#94a3b8">
      You are receiving this because you are an admin of ${payload.orgName} on Mise.
      <a href="${APP_URL}/settings/notifications" style="color:#94a3b8">Manage preferences</a>
    </p>
  `);

  try {
    await resend.emails.send({ from: FROM, to: payload.to, subject, html });
  } catch {
    console.error("[email] Failed to send alert email");
  }
}

// ─── Weekly digest ────────────────────────────────────────────────────────────

export async function sendWeeklyDigest(payload: DigestPayload) {
  if (!resend || payload.to.length === 0) return;

  const fmt = (n: number) => n.toLocaleString();

  const topWastedRows = payload.topWasted
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;color:#374151;border-bottom:1px solid #f1f5f9">${i.name}</td>` +
        `<td style="padding:6px 0;text-align:right;font-weight:600;color:#ef4444;border-bottom:1px solid #f1f5f9">${i.qty} ${i.unit}</td></tr>`
    )
    .join("");

  const statCards = [
    { label: "Total Items", value: fmt(payload.totalItems), color: "#4f46e5" },
    { label: "Low Stock Alerts", value: fmt(payload.lowStockCount), color: payload.lowStockCount > 0 ? "#d97706" : "#10b981" },
    { label: "Receipts This Week", value: fmt(payload.weekReceipts), color: "#10b981" },
    { label: "Issues This Week", value: fmt(payload.weekIssues), color: "#ef4444" },
  ]
    .map(
      (s) =>
        `<div style="background:#f8fafc;border-radius:8px;padding:14px;border:1px solid #e2e8f0">` +
        `<p style="margin:0;font-size:22px;font-weight:700;color:${s.color}">${s.value}</p>` +
        `<p style="margin:4px 0 0;font-size:12px;color:#64748b">${s.label}</p></div>`
    )
    .join("");

  const html = emailShell(`
    ${logoHeader("Weekly Inventory Summary")}
    <p style="margin:0 0 20px;font-size:14px;color:#64748b">${payload.orgName}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px">${statCards}</div>
    ${
      payload.pendingPOs > 0
        ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin-bottom:20px">
             <p style="margin:0;font-size:13px;color:#1d4ed8">🛒 <strong>${payload.pendingPOs}</strong> purchase order${payload.pendingPOs !== 1 ? "s" : ""} pending delivery</p>
           </div>`
        : ""
    }
    ${
      payload.topWasted.length > 0
        ? `<div style="margin-bottom:20px">
             <p style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px">Top Wasted Items</p>
             <table style="width:100%;border-collapse:collapse;font-size:13px">${topWastedRows}</table>
           </div>`
        : ""
    }
    <a href="${payload.appUrl}/dashboard"
       style="display:inline-block;background:#4f46e5;color:#fff;padding:11px 22px;border-radius:7px;text-decoration:none;font-size:14px;font-weight:500">
      Open Dashboard →
    </a>
    <p style="margin-top:20px;font-size:12px;color:#94a3b8">
      Weekly digest for ${payload.orgName} · <a href="${payload.appUrl}/settings/notifications" style="color:#94a3b8">manage preferences</a>
    </p>
  `);

  try {
    await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject: `[Mise] Weekly summary for ${payload.orgName}`,
      html,
    });
  } catch {
    console.error("[email] Failed to send weekly digest");
  }
}
