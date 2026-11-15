require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "20kb" }));

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",").map(v => v.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-CEA-Request"]
}));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000
});

const COOKIE_NAME = "cea_admin_session";
const SESSION_DAYS = 1;
const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000
};

function requireTrustedRequest(req, res, next) {
  const origin = req.get("origin");
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "Request origin is not allowed." });
  }
  if (req.method !== "GET" && req.get("x-cea-request") !== "1") {
    return res.status(403).json({ error: "Invalid request." });
  }
  next();
}
app.use("/api", requireTrustedRequest);

async function initialiseDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cea_admin_users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS cea_admin_sessions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES cea_admin_users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS cea_admin_sessions_expiry_idx
      ON cea_admin_sessions(expires_at);
  `);

  const email = (process.env.CEA_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.CEA_ADMIN_PASSWORD || "";
  if (email && password) {
    if (password.length < 12) throw new Error("CEA_ADMIN_PASSWORD must be at least 12 characters.");
    const existing = await pool.query("SELECT id FROM cea_admin_users WHERE email = $1", [email]);
    if (existing.rowCount === 0) {
      const hash = await bcrypt.hash(password, 12);
      await pool.query(
        "INSERT INTO cea_admin_users(email, full_name, password_hash) VALUES($1, $2, $3)",
        [email, process.env.CEA_ADMIN_NAME || "School Administrator", hash]
      );
      console.log("Initial CEA administrator account created.");
    }
  }
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function getSession(req) {
  const token = req.headers.cookie?.split(";").map(x => x.trim())
    .find(x => x.startsWith(COOKIE_NAME + "="))?.slice(COOKIE_NAME.length + 1);
  if (!token) return null;
  const result = await pool.query(
    `SELECT u.id, u.email, u.full_name
       FROM cea_admin_sessions s
       JOIN cea_admin_users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.is_active = TRUE`,
    [hashToken(decodeURIComponent(token))]
  );
  return result.rows[0] || null;
}

async function requireAdmin(req, res, next) {
  try {
    const user = await getSession(req);
    if (!user) return res.status(401).json({ error: "Please sign in again." });
    req.admin = user;
    next();
  } catch (error) {
    next(error);
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Please wait and try again." }
});

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, service: "CEA API", database: "connected" });
  } catch (_error) {
    res.status(503).json({ ok: false, database: "unavailable" });
  }
});

app.post("/api/auth/login", loginLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password || email.length > 254 || password.length > 200) {
      return res.status(400).json({ error: "Enter your email and password." });
    }
    const result = await pool.query(
      "SELECT id, email, full_name, password_hash FROM cea_admin_users WHERE email = $1 AND is_active = TRUE",
      [email]
    );
    const user = result.rows[0];
    const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!valid) return res.status(401).json({ error: "Email or password is incorrect." });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
    await pool.query("DELETE FROM cea_admin_sessions WHERE expires_at <= NOW()");
    await pool.query(
      "INSERT INTO cea_admin_sessions(user_id, token_hash, expires_at) VALUES($1, $2, $3)",
      [user.id, hashToken(token), expiresAt]
    );
    res.cookie(COOKIE_NAME, token, cookieOptions);
    res.json({ ok: true, user: { name: user.full_name, email: user.email, role: "admin" } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAdmin, (req, res) => {
  res.json({ ok: true, user: { name: req.admin.full_name, email: req.admin.email, role: "admin" } });
});

app.post("/api/auth/logout", async (req, res, next) => {
  try {
    const token = req.headers.cookie?.split(";").map(x => x.trim())
      .find(x => x.startsWith(COOKIE_NAME + "="))?.slice(COOKIE_NAME.length + 1);
    if (token) await pool.query("DELETE FROM cea_admin_sessions WHERE token_hash = $1", [hashToken(decodeURIComponent(token))]);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error("CEA API error:", error.message);
  res.status(500).json({ error: "The request could not be completed." });
});

const port = Number(process.env.PORT || 3000);
initialiseDatabase()
  .then(() => app.listen(port, () => console.log("CEA API is ready on port " + port)))
  .catch(error => {
    console.error("CEA API startup failed:", error.message);
    process.exit(1);
  });

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});
