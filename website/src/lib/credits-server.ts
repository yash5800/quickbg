import { MongoClient, Db, Collection, ObjectId } from "mongodb";

/**
 * Single source of truth for upload credits.
 *
 * One collection (`credit_usage`), one atomic counter per (clientKey, hourly
 * window). Consume and refund are idempotent on the caller-supplied `imageId`,
 * so retries, re-renders, React StrictMode double-invocation, and page reloads
 * can never double-count or skip a charge. The server value returned here is
 * the only number the client should ever display.
 */

export const HOURLY_LIMIT = 25;
export const HOUR_WINDOW_MS = 60 * 60 * 1000;

export interface CreditUsageDoc {
  _id?: ObjectId;
  clientKey: string;
  windowStart: number;
  used: number;
  chargedIds: string[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface CreditState {
  allowed: boolean;
  used: number;
  remaining: number;
  resetInSeconds: number;
}

// Persist the Mongo client across module reloads (dev) and warm lambdas.
declare global {
  // eslint-disable-next-line no-var
  var __bgremover_credits_client: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var __bgremover_credits_db: Db | undefined;
}

type MongoGlobal = typeof globalThis & {
  __bgremover_credits_client?: MongoClient;
  __bgremover_credits_db?: Db;
};

const mongoGlobal = globalThis as MongoGlobal;

let indexesEnsured = false;

function getWindowStart(nowMs: number): number {
  return Math.floor(nowMs / HOUR_WINDOW_MS) * HOUR_WINDOW_MS;
}

function getResetInSeconds(windowStart: number, nowMs: number): number {
  return Math.max(1, Math.ceil((windowStart + HOUR_WINDOW_MS - nowMs) / 1000));
}

function isDuplicateKeyError(error: unknown): boolean {
  const details = error as { code?: number; codeName?: string } | null;
  return details?.code === 11000 || details?.codeName === "DuplicateKey";
}

async function getDb(): Promise<Db> {
  const uri = process.env.NEXT_MONGODB_URI;
  if (!uri) {
    throw new Error("NEXT_MONGODB_URI not configured");
  }

  if (mongoGlobal.__bgremover_credits_client && mongoGlobal.__bgremover_credits_db) {
    try {
      await mongoGlobal.__bgremover_credits_client.db("admin").command({ ping: 1 });
      return mongoGlobal.__bgremover_credits_db;
    } catch {
      try {
        await mongoGlobal.__bgremover_credits_client.close();
      } catch {
        // ignore
      }
      mongoGlobal.__bgremover_credits_client = undefined;
      mongoGlobal.__bgremover_credits_db = undefined;
      indexesEnsured = false;
    }
  }

  const client = new MongoClient(uri);
  await client.connect();
  const database = client.db(process.env.NEXT_MONGODB_DB || "bgremover");

  mongoGlobal.__bgremover_credits_client = client;
  mongoGlobal.__bgremover_credits_db = database;

  return database;
}

async function getCollection(): Promise<Collection<CreditUsageDoc>> {
  const database = await getDb();
  const collection = database.collection<CreditUsageDoc>("credit_usage");

  if (!indexesEnsured) {
    try {
      await collection.createIndex({ clientKey: 1, windowStart: 1 }, { unique: true });
      await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    } catch (error) {
      // Index option conflicts are non-fatal; the collection is still usable.
      console.warn("[credits] ensure index warning", error);
    }
    indexesEnsured = true;
  }

  return collection;
}

function toState(doc: Pick<CreditUsageDoc, "used"> | null, windowStart: number, nowMs: number, allowed: boolean): CreditState {
  const used = Math.min(HOURLY_LIMIT, Math.max(0, doc?.used ?? 0));
  return {
    allowed,
    used,
    remaining: Math.max(0, HOURLY_LIMIT - used),
    resetInSeconds: getResetInSeconds(windowStart, nowMs),
  };
}

/**
 * Atomically consume one credit for `imageId`. Idempotent: charging the same
 * imageId twice within a window counts once. Returns `allowed: false` (without
 * charging) when the window is already at the limit.
 */
export async function consumeCredit(clientKey: string, imageId: string): Promise<CreditState> {
  const collection = await getCollection();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const now = Date.now();
    const windowStart = getWindowStart(now);
    const nowDate = new Date(now);
    const expiresAt = new Date(windowStart + HOUR_WINDOW_MS);

    try {
      const updated = await collection.findOneAndUpdate(
        {
          clientKey,
          windowStart,
          chargedIds: { $ne: imageId },
          used: { $lt: HOURLY_LIMIT },
        },
        {
          $inc: { used: 1 },
          $push: { chargedIds: imageId },
          $set: { updatedAt: nowDate },
          $setOnInsert: { clientKey, windowStart, createdAt: nowDate, expiresAt },
        },
        { upsert: true, returnDocument: "after" }
      );

      if (updated) {
        return toState(updated, windowStart, now, true);
      }
    } catch (error) {
      if (!isDuplicateKeyError(error)) {
        throw error;
      }
      // Doc exists but our filter excluded it (already charged, or at limit).
    }

    // Resolve the no-match / duplicate-key case against the current document.
    const current = await collection.findOne(
      { clientKey, windowStart },
      { projection: { used: 1, chargedIds: 1 } }
    );

    if (current?.chargedIds?.includes(imageId)) {
      // Already charged this image — idempotent success, no extra deduction.
      return toState(current, windowStart, now, true);
    }

    if ((current?.used ?? 0) >= HOURLY_LIMIT) {
      return toState(current, windowStart, now, false);
    }

    // Genuine race (doc created/changed between ops): retry.
  }

  const now = Date.now();
  const windowStart = getWindowStart(now);
  const current = await collection.findOne(
    { clientKey, windowStart },
    { projection: { used: 1, chargedIds: 1 } }
  );
  const alreadyCharged = current?.chargedIds?.includes(imageId) ?? false;
  return toState(current, windowStart, now, alreadyCharged || (current?.used ?? 0) < HOURLY_LIMIT);
}

/**
 * Atomically refund the credit previously consumed for `imageId`. Idempotent:
 * a no-op if `imageId` was never charged (or already refunded).
 */
export async function refundCredit(clientKey: string, imageId: string): Promise<CreditState> {
  const collection = await getCollection();
  const now = Date.now();
  const windowStart = getWindowStart(now);
  const nowDate = new Date(now);

  const updated = await collection.findOneAndUpdate(
    { clientKey, windowStart, chargedIds: imageId, used: { $gt: 0 } },
    { $inc: { used: -1 }, $pull: { chargedIds: imageId }, $set: { updatedAt: nowDate } },
    { returnDocument: "after" }
  );

  if (updated) {
    return toState(updated, windowStart, now, true);
  }

  // Nothing to refund — return the current authoritative state.
  const current = await collection.findOne(
    { clientKey, windowStart },
    { projection: { used: 1 } }
  );
  return toState(current, windowStart, now, true);
}

/**
 * Record an upload in the `user_uploads` collection for admin analytics only
 * (distinct users, upload trends). This is NEVER used for credit math — the
 * authoritative counter is `credit_usage`. Best-effort; failures are swallowed.
 */
export async function recordUploadAnalytics(clientKey: string): Promise<void> {
  try {
    const database = await getDb();
    const now = new Date();
    await database.collection("user_uploads").insertOne({
      ip: clientKey,
      fileName: "direct-worker-upload",
      uploadedAt: now,
      hourKey: `window_${getWindowStart(now.getTime())}`,
    });
  } catch (error) {
    console.warn("[credits] analytics insert warning", error);
  }
}

/** Read-only authoritative credit state for `clientKey` in the current window. */
export async function getUsage(clientKey: string): Promise<CreditState> {
  const collection = await getCollection();
  const now = Date.now();
  const windowStart = getWindowStart(now);

  const current = await collection.findOne(
    { clientKey, windowStart, expiresAt: { $gt: new Date(now) } },
    { projection: { used: 1 } }
  );

  return toState(current, windowStart, now, (current?.used ?? 0) < HOURLY_LIMIT);
}
