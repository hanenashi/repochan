import express from "express";
import cors from "cors";
import "dotenv/config";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDb } from "./firebaseAdmin.js";
import { DEFAULT_CHECKLIST, DEFAULT_SHOP_ID, DEFAULT_STAFF } from "../data/defaultChecklist.js";

const app = express();
const db = getDb();
const port = Number(process.env.PORT || 5174);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");

app.use(cors());
app.use(express.json());
app.use(express.static(distDir));

function isoDateFromRequest(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

function dailyRef(shopId, date) {
  return db.collection("shops").doc(shopId).collection("dailyChecks").doc(date);
}

function serializeDoc(doc) {
  return { id: doc.id, ...doc.data() };
}

async function ensureBootstrap() {
  const shopRef = db.collection("shops").doc(DEFAULT_SHOP_ID);
  await shopRef.set(
    {
      name: "Repochan",
      defaultFridgeTemp: "4 C",
      defaultFreezerTemp: "-18 C",
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  const batch = db.batch();
  DEFAULT_STAFF.forEach((staff) => {
    batch.set(shopRef.collection("staff").doc(staff.id), staff, { merge: true });
  });
  DEFAULT_CHECKLIST.forEach((item, index) => {
    batch.set(
      shopRef.collection("checkItems").doc(item.id),
      { ...item, sortOrder: index, active: true },
      { merge: true }
    );
  });
  await batch.commit();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/bootstrap", async (_req, res, next) => {
  try {
    await ensureBootstrap();
    res.json({ ok: true, shopId: DEFAULT_SHOP_ID });
  } catch (error) {
    next(error);
  }
});

app.get("/api/bootstrap", async (_req, res, next) => {
  try {
    await ensureBootstrap();
    res.json({ ok: true, shopId: DEFAULT_SHOP_ID });
  } catch (error) {
    next(error);
  }
});

app.get("/api/staff", async (_req, res, next) => {
  try {
    const snap = await db.collection("shops").doc(DEFAULT_SHOP_ID).collection("staff").get();
    res.json(snap.docs.map(serializeDoc));
  } catch (error) {
    next(error);
  }
});

app.get("/api/check-items", async (_req, res, next) => {
  try {
    const snap = await db
      .collection("shops")
      .doc(DEFAULT_SHOP_ID)
      .collection("checkItems")
      .orderBy("sortOrder")
      .get();
    res.json(snap.docs.map(serializeDoc).filter((item) => item.active));
  } catch (error) {
    next(error);
  }
});

app.get("/api/days", async (req, res, next) => {
  try {
    const month = String(req.query.month || isoDateFromRequest()).slice(0, 7);
    const snap = await db
      .collection("shops")
      .doc(DEFAULT_SHOP_ID)
      .collection("dailyChecks")
      .where("date", ">=", `${month}-01`)
      .where("date", "<=", `${month}-31`)
      .get();

    res.json(snap.docs.map(serializeDoc));
  } catch (error) {
    next(error);
  }
});

app.get("/api/days/:date", async (req, res, next) => {
  try {
    const doc = await dailyRef(DEFAULT_SHOP_ID, req.params.date).get();
    if (!doc.exists) {
      res.json(null);
      return;
    }
    res.json(serializeDoc(doc));
  } catch (error) {
    next(error);
  }
});

app.put("/api/days/:date/all-ok", async (req, res, next) => {
  try {
    const { staffId = "stan", staffName = "stan" } = req.body || {};
    const ref = dailyRef(DEFAULT_SHOP_ID, req.params.date);
    const payload = {
      date: req.params.date,
      shopId: DEFAULT_SHOP_ID,
      overallStatus: "ok",
      mode: "all_ok_confirmation",
      reviewedBy: { id: staffId, name: staffName },
      reviewedAt: Timestamp.now(),
      exceptionCount: 0,
      exceptions: [],
      updatedAt: FieldValue.serverTimestamp()
    };
    await ref.set(payload, { merge: true });
    const doc = await ref.get();
    res.json(serializeDoc(doc));
  } catch (error) {
    next(error);
  }
});

app.post("/api/days/:date/exceptions", async (req, res, next) => {
  try {
    const { itemId, title, value, note, actionTaken, staffId = "stan", staffName = "stan" } = req.body || {};
    if (!itemId || !title || !note) {
      res.status(400).json({ error: "itemId, title, and note are required." });
      return;
    }

    const exception = {
      id: db.collection("_ids").doc().id,
      itemId,
      title,
      value: value || "",
      note,
      actionTaken: actionTaken || "",
      resolved: Boolean(actionTaken),
      recordedBy: { id: staffId, name: staffName },
      recordedAt: Timestamp.now()
    };

    const ref = dailyRef(DEFAULT_SHOP_ID, req.params.date);
    await ref.set(
      {
        date: req.params.date,
        shopId: DEFAULT_SHOP_ID,
        overallStatus: "has_exception",
        mode: "exception_log",
        reviewedBy: { id: staffId, name: staffName },
        reviewedAt: Timestamp.now(),
        exceptions: FieldValue.arrayUnion(exception),
        exceptionCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    const doc = await ref.get();
    res.json(serializeDoc(doc));
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.reason === "SERVICE_DISABLED" || String(error.message).includes("firestore.googleapis.com")) {
    res.status(503).json({
      error: "Cloud Firestore is not enabled for this Firebase project yet. Enable Cloud Firestore in Firebase Console, then run npm run seed."
    });
    return;
  }

  res.status(500).json({ error: error.message || "Server error" });
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Repochan API listening on http://localhost:${port}`);
});
