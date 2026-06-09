import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "../server/firebaseAdmin.js";
import { DEFAULT_CHECKLIST, DEFAULT_SHOP_ID, DEFAULT_STAFF } from "../data/defaultChecklist.js";

const db = getDb();
const shopRef = db.collection("shops").doc(DEFAULT_SHOP_ID);

try {
  await shopRef.set(
    {
      name: "Repochan",
      timezone: "Asia/Tokyo",
      haccpMode: "exception_based",
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
      {
        ...item,
        sortOrder: index,
        active: true,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
  });

  await batch.commit();

  console.log(`Seeded Firestore shop "${DEFAULT_SHOP_ID}" with ${DEFAULT_CHECKLIST.length} checklist items.`);
  process.exit(0);
} catch (error) {
  if (error.reason === "SERVICE_DISABLED" || String(error.message).includes("firestore.googleapis.com")) {
    console.error("Firestore is not enabled for this Firebase project yet.");
    console.error("Enable Cloud Firestore in the Firebase console, then run `npm run seed` again.");
    console.error("Project: repochan");
    console.error("Service: firestore.googleapis.com");
    process.exit(1);
  }

  throw error;
}
