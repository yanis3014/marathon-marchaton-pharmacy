// server.js (ESM)

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Sequelize, DataTypes } from "sequelize";
import * as dotenv from "dotenv";
import { Readable } from "stream";
import { format as csvFormat } from "@fast-csv/format";

import QRCode from "qrcode";
import { customAlphabet } from "nanoid";
import cron from "node-cron";
import { DateTime } from "luxon";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

// ---------------------------
// CORS (prod + previews Vercel)
// ---------------------------
const allowList = (
  process.env.ALLOWED_ORIGINS ||
  process.env.ALLOWED_ORIGIN ||
  ""
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const originRegex = process.env.ALLOWED_ORIGIN_REGEX
  ? new RegExp(process.env.ALLOWED_ORIGIN_REGEX)
  : null;

app.use(
  cors({
    origin(origin, cb) {
      // autoriser appels serveur→serveur (curl, cron, health checks)
      if (!origin) return cb(null, true);
      if (allowList.includes(origin)) return cb(null, true);
      if (originRegex && originRegex.test(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-token"],
    optionsSuccessStatus: 204,
  })
);
// OPTIONS préflight
app.options("*", cors());

// ---------------------------
// Sécurité & limites
// ---------------------------
app.use(helmet());
app.use(rateLimit({ windowMs: 60_000, max: 300 })); // 300 req / min / IP

// ---------------------------
// Parsers body
// ---------------------------
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------
// Base de données
// ---------------------------
let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    logging: false,
    dialectOptions: {
      ssl: process.env.PGSSLMODE === "require" ? { require: true } : false,
    },
  });
} else {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.SQLITE_PATH || "data.sqlite",
    logging: false,
  });
}

// Modèle des inscriptions
const Registration = sequelize.define(
  "Registration",
  {
    fullName: { type: DataTypes.STRING, allowNull: false },
    dob: { type: DataTypes.DATEONLY, allowNull: false },
    sex: { type: DataTypes.ENUM("Homme", "Femme"), allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
    },
    affiliation: {
      type: DataTypes.ENUM(
        "Étudiant(e)",
        "Enseignant(e)",
        "Pharmacien(ne)",
        "Personnel",
        "Technicien(ne)",
        "Ancien(ne) diplômé(e)",
        "Famille / accompagnant"
      ),
      allowNull: false,
    },
    eventChoice: {
      type: DataTypes.ENUM("Pharmathon (8 km)", "marchathon (4 km)"),
      allowNull: false,
    },
    confirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
    confirmToken: { type: DataTypes.STRING },
    checkinCode: { type: DataTypes.STRING },
    checkinAt: { type: DataTypes.DATE },
    reminded7: { type: DataTypes.BOOLEAN, defaultValue: false },
    reminded3: { type: DataTypes.BOOLEAN, defaultValue: false },
    reminded1: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    indexes: [{ unique: true, fields: ["email", "eventChoice"] }],
  }
);

// ---------------------------
// SMTP / E-mails
// ---------------------------
// ---------------------------
// SMTP / E-mails (REMPLACÉ PAR L'API BREVO)
// ---------------------------

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendEmailWithBrevo(
  toEmail,
  toName,
  subject,
  htmlContent,
  attachment
) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("BREVO_API_KEY not set, skipping email.");
    return;
  }

  // L'adresse d'expéditeur doit être validée sur Brevo
  const fromEmail = (process.env.SMTP_FROM || "").match(/<(.*)>/)?.[1];
  const fromName = (process.env.SMTP_FROM || "").replace(/<.*>/, "").trim();

  if (!fromEmail) {
    console.error(
      "SMTP_FROM format is invalid. Should be 'Name <email@example.com>'"
    );
    return;
  }

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: toEmail, name: toName }],
    subject,
    htmlContent,
  };

  if (attachment) {
    payload.attachment = [
      {
        // Le QR code est un Buffer, il faut le convertir en Base64 pour l'API JSON
        content: attachment.content.toString("base64"),
        name: attachment.filename,
      },
    ];
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(
        `Brevo API Error (${response.status}): ${JSON.stringify(errorBody)}`
      );
    }
    console.log(`Email sent successfully to ${toEmail} via Brevo API.`);
  } catch (error) {
    console.error("Failed to send email with Brevo:", error);
  }
}

const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

async function sendConfirmationEmail(reg) {
  // Génère l'image PNG du QR (checkinCode)
  const qrPng = await QRCode.toBuffer(reg.checkinCode, {
    type: "png",
    width: 512,
    margin: 1,
  });

  const html = `
  <div style="font-family:Arial,sans-serif">
    <h2>Pharmathon & marchathon — Confirmation d'inscription</h2>
    <p>Bonjour ${reg.fullName},</p>
    <p>Merci pour votre inscription à l'événement de la Faculté de Pharmacie de Monastir.</p>
    <ul>
      <li><strong>Épreuve :</strong> ${reg.eventChoice}</li>
      <li><strong>Date :</strong> 16 novembre 2025</li>
      <li><strong>Départ :</strong> FPHM</li>
    </ul>
    <p>Votre code de présence (QR) est joint. Présentez-le le jour J au pointage.</p>
    <p>À bientôt !</p>
  </div>`;

  // NOUVEL APPEL
  await sendEmailWithBrevo(
    reg.email,
    reg.fullName,
    "Confirmation d'inscription — Pharmathon & marchathon (FPHM)",
    html,
    { filename: "qr-checkin.png", content: qrPng }
  );
}

async function sendReminderEmail(reg, daysLeft) {
  const html = `
    <div style="font-family:Arial,sans-serif">
      <h2>Pharmathon & marchathon — Rappel (J-${daysLeft})</h2>
      <p>Bonjour ${reg.fullName},</p>
      <p>L'événement approche ! Nous vous attendons le <strong>16 novembre 2025</strong> à la <em>Faculté de Pharmacie de Monastir</em>.</p>
      <p>Épreuve : <strong>${reg.eventChoice}</strong></p>
      <p>Merci d'apporter votre QR code de pointage reçu par email lors de votre inscription.</p>
      <p>À très vite !</p>
    </div>`;

  // NOUVEL APPEL
  await sendEmailWithBrevo(
    reg.email,
    reg.fullName,
    `Rappel — Pharmathon & marchathon (J-${daysLeft})`,
    html
  );
}

// ---------------------------
// Utils validation / parsing
// ---------------------------
function isValidPhone(str) {
  return /^[0-9+\-\s]{6,20}$/.test(str || "");
}

function parseBody(req) {
  const { fullName, dob, sex, phone, email, affiliation, eventChoice } =
    req.body || {};
  const errors = [];

  if (!fullName || fullName.trim().length < 2)
    errors.push("Nom et prénom requis.");
  if (!dob || isNaN(Date.parse(dob)))
    errors.push("Date de naissance invalide (YYYY-MM-DD).");
  if (!["Homme", "Femme"].includes(sex)) errors.push("Sexe invalide.");
  if (!isValidPhone(phone)) errors.push("Numéro de téléphone invalide.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push("Adresse e-mail invalide.");
  const affiliations = [
    "Étudiant(e)",
    "Enseignant(e)",
    "Pharmacien(ne)",
    "Personnel",
    "Technicien(ne)",
    "Ancien(ne) diplômé(e)",
    "Famille / accompagnant",
  ];
  if (!affiliations.includes(affiliation))
    errors.push("Lien avec la FPHM invalide.");
  const choices = ["Pharmathon (8 km)", "marchathon (4 km)"];
  if (!choices.includes(eventChoice))
    errors.push("Choix de l’épreuve invalide.");

  return {
    data: { fullName, dob, sex, phone, email, affiliation, eventChoice },
    errors,
  };
}

// ---------------------------
// Middlewares / helpers admin
// ---------------------------
function requireAdmin(req, res, next) {
  const token = req.header("x-admin-token");
  if (!token || token !== (process.env.ADMIN_TOKEN || "")) {
    return res.status(401).json({ ok: false, error: "Non autorisé." });
  }
  next();
}

// ---------------------------
// Rappels J-7 / J-3 / J-1
// ---------------------------
const EVENT_DATE_ISO = process.env.EVENT_DATE || "2025-11-16";
const TZ = process.env.TIMEZONE || "Africa/Tunis";
const REMINDER_HOUR = parseInt(process.env.REMINDER_HOUR || "9", 10);

async function processReminders() {
  const now = DateTime.now().setZone(TZ);
  const eventDate = DateTime.fromISO(EVENT_DATE_ISO, { zone: TZ }).endOf("day");
  const daysLeft = Math.ceil(eventDate.diff(now, "days").days);

  const targetFlag =
    daysLeft === 7
      ? "reminded7"
      : daysLeft === 3
      ? "reminded3"
      : daysLeft === 1
      ? "reminded1"
      : null;

  if (!targetFlag) return { skipped: true, daysLeft };

  const regs = await Registration.findAll({ where: { confirmed: true } });
  let sent = 0;

  for (const r of regs) {
    if (daysLeft === 7 && !r.reminded7) {
      await sendReminderEmail(r, 7);
      r.reminded7 = true;
      await r.save();
      sent++;
    }
    if (daysLeft === 3 && !r.reminded3) {
      await sendReminderEmail(r, 3);
      r.reminded3 = true;
      await r.save();
      sent++;
    }
    if (daysLeft === 1 && !r.reminded1) {
      await sendReminderEmail(r, 1);
      r.reminded1 = true;
      await r.save();
      sent++;
    }
  }

  return { skipped: false, daysLeft, sent };
}

// Cron quotidien HH:00 dans le fuseau spécifié
cron.schedule(
  `0 ${REMINDER_HOUR} * * *`,
  async () => {
    try {
      const res = await processReminders();
      if (!res.skipped)
        console.log(`Reminder job J-${res.daysLeft}: sent ${res.sent}`);
    } catch (e) {
      console.error("Reminder job failed:", e);
    }
  },
  { timezone: TZ }
);

// ---------------------------
// Routes
// ---------------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, now: new Date().toISOString() });
});

app.get("/api/confirm", async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send("Token manquant.");
  const reg = await Registration.findOne({ where: { confirmToken: token } });
  if (!reg) return res.status(404).send("Token invalide.");
  reg.confirmed = true;
  await reg.save();
  const front = process.env.FRONTEND_BASE_URL;
  if (front) return res.redirect(`${front}/confirm?status=ok`);
  res.send("Adresse e-mail confirmée. Merci !");
});

app.post("/api/register", async (req, res) => {
  try {
    const { data, errors } = parseBody(req);
    if (errors.length) return res.status(400).json({ ok: false, errors });
    const created = await Registration.create({
      ...data,
      confirmToken: nano(),
      checkinCode: nano(),
    });
    // envoi d'email non bloquant
    sendConfirmationEmail(created).catch((err) =>
      console.error("Email error:", err)
    );
    res.json({ ok: true, registration: { id: created.id } });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        ok: false,
        errors: ["Cette adresse e-mail est déjà inscrite pour cette épreuve."],
      });
    }
    console.error(err);
    res.status(500).json({ ok: false, error: "Erreur serveur." });
  }
});

// Déclenchement manuel des rappels (protégé)
app.post("/api/admin/send-reminders", requireAdmin, async (req, res) => {
  try {
    const result = await processReminders();
    res.json({ ok: true, result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Erreur envoi rappels." });
  }
});

// Liste officielle (admin)
app.get("/api/registrations", requireAdmin, async (req, res) => {
  const list = await Registration.findAll({ order: [["createdAt", "DESC"]] });
  res.json({ ok: true, registrations: list });
});

// Check-in officiel (admin)
app.post("/api/admin/checkin", requireAdmin, async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ ok: false, error: "Code requis." });
  const reg = await Registration.findOne({ where: { checkinCode: code } });
  if (!reg)
    return res.status(404).json({ ok: false, error: "Code introuvable." });
  reg.checkinAt = new Date();
  await reg.save();
  res.json({ ok: true, registration: reg, name: reg.fullName });
});

// --- Alias compat (optionnel) ---
app.get("/api/participants", requireAdmin, async (req, res) => {
  const regs = await Registration.findAll({ order: [["createdAt", "DESC"]] });
  const out = regs.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    email: r.email,
    eventChoice: r.eventChoice,
    checkedIn: !!r.checkinAt,
    qrCode: r.checkinCode,
  }));
  res.json({ ok: true, registrations: out });
});

app.post("/api/checkin/:code", requireAdmin, async (req, res) => {
  const { code } = req.params;
  const reg = await Registration.findOne({ where: { checkinCode: code } });
  if (!reg)
    return res.status(404).json({ ok: false, error: "Code introuvable" });
  reg.checkinAt = new Date();
  await reg.save();
  res.json({ ok: true, name: reg.fullName });
});

// Export CSV (admin)
app.get("/api/export/csv", requireAdmin, async (req, res) => {
  const rows = await Registration.findAll({ order: [["createdAt", "DESC"]] });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=inscriptions.csv");
  const stream = Readable.from(rows.map((r) => r.toJSON()));
  const csvStream = csvFormat({ headers: true });
  stream.pipe(csvStream).pipe(res);
});

// ---------------------------
// Démarrage
// ---------------------------
const PORT = process.env.PORT || 3001;

async function start() {
  await sequelize.sync();
  app.listen(PORT, () => {
    console.log(`✅ Backend running on :${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start", err);
  process.exit(1);
});
