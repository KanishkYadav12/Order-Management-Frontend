/**
 * Single source of truth for runtime configuration.
 *
 * There were previously three competing sources — a hardcoded localhost URL
 * here, a hardcoded Vercel URL in `utils/api-config.js`, and the environment
 * variable in `lib/api.js` — and different modules imported different ones.
 * Everything now resolves through this file.
 */

const stripTrailingSlash = (value) => String(value ?? "").replace(/\/+$/, "");

/** Base URL of the API, including the `/api/v1` prefix. */
export const serverUrl = stripTrailingSlash(
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5000/api/v1"
);

/** Origin of the customer-facing QR menu, used when previewing table links. */
export const customerAppUrl = stripTrailingSlash(
  process.env.NEXT_PUBLIC_CUSTOMER_APP_URL || "http://localhost:3001"
);

export const isProduction = process.env.NODE_ENV === "production";

/* ── Placeholder imagery ──────────────────────────────────────────────── */

export const defaultDishLogo =
  "https://static.vecteezy.com/system/resources/previews/010/354/788/original/main-dish-icon-colorful-flat-design-illustration-graphics-free-vector.jpg";

export const defaultBannerLogo =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80";

export const defaultProfileLogo =
  "https://static.vecteezy.com/system/resources/previews/036/594/092/original/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg";

/* ── Domain constants, mirrored from the API ──────────────────────────── */

export const ROLES = {
  SUPER_ADMIN: "superadmin",
  HOTEL_OWNER: "hotelowner",
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "Platform admin",
  [ROLES.HOTEL_OWNER]: "Owner",
};

export const ORDER_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const BILL_STATUS = {
  UNPAID: "unpaid",
  PAID: "paid",
  PAY_LATER: "payLater",
  REFUNDED: "refunded",
  VOID: "void",
};

export const PAYMENT_METHODS = {
  CASH: "cash",
  CARD: "card",
  UPI: "upi",
  WALLET: "wallet",
  OTHER: "other",
};

export const TABLE_STATUS = {
  FREE: "free",
  OCCUPIED: "occupied",
  RESERVED: "reserved",
  CLEANING: "cleaning",
};

export default {
  serverUrl,
  customerAppUrl,
  isProduction,
  ROLES,
  ORDER_STATUS,
  BILL_STATUS,
  PAYMENT_METHODS,
  TABLE_STATUS,
};
