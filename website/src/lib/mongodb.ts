import { MongoClient, Db, ObjectId } from "mongodb";
import { v4 as uuidv4 } from "uuid";

const uri = process.env.NEXT_MONGODB_URI;

interface JobDocument {
  _id?: ObjectId;
  jobId: string;
  status: "queued" | "running" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  fileName: string;
  sessionId: string;
  resultPath?: string;
  error?: string;
}

let mongoClient: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB() {
  if (!mongoClient && uri) {
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    db = mongoClient.db("testbgremover");
    
    const jobs = db.collection<JobDocument>("jobs");
    
    // Create indexes
    await jobs.createIndex({ jobId: 1 }, { unique: true });
    await jobs.createIndex({ sessionId: 1, createdAt: -1 });
    
    // TTL index: auto-delete documents when expiresAt is reached
    await jobs.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    console.log("[MongoDB] Connection established and indexes created");
  }
  return db;
}

export async function closeDB() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    db = null;
    console.log("[MongoDB] Connection closed");
  }
}

export function getJobsCollection(database: Db) {
  return database.collection<JobDocument>("jobs");
}

/**
 * Create a new job in the database
 * @param fileName Original filename
 * @param sessionId User session identifier
 * @returns Created job document
 */
export async function createJob(fileName: string, sessionId: string) {
  if (!db) {
    await connectDB();
  }
  
  const jobs = getJobsCollection(db!);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
  
  const jobId = uuidv4();
  const job: JobDocument = {
    jobId,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    expiresAt,
    fileName,
    sessionId,
  };
  
  await jobs.insertOne(job);
  console.log(`[Job Created] ${jobId} - expires at ${expiresAt.toISOString()}`);
  
  return job;
}

/**
 * Update job status
 * @param jobId Job identifier
 * @param status New status
 * @param data Additional fields to update
 */
export async function updateJobStatus(
  jobId: string,
  status: "queued" | "running" | "completed" | "failed",
  data?: { resultPath?: string; error?: string }
) {
  if (!db) {
    await connectDB();
  }
  
  const jobs = getJobsCollection(db!);
  const update: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };
  
  if (data?.resultPath) update.resultPath = data.resultPath;
  if (data?.error) update.error = data.error;
  
  await jobs.updateOne({ jobId }, { $set: update });
  console.log(`[Job Updated] ${jobId} - status: ${status}`);
}

export async function getSessionStats(sessionId: string) {
  if (!db) {
    await connectDB();
  }
  
  const jobs = getJobsCollection(db!);
  
  const [total, queued, running, completed, failed] = await Promise.all([
    jobs.countDocuments({ sessionId }),
    jobs.countDocuments({ sessionId, status: "queued" }),
    jobs.countDocuments({ sessionId, status: "running" }),
    jobs.countDocuments({ sessionId, status: "completed" }),
    jobs.countDocuments({ sessionId, status: "failed" }),
  ]);
  
  return { total, queued, running, completed, failed };
}

/**
 * Get progress percentage based on job status
 * Removed: progress field is now derived from status
 */
export function getProgressFromStatus(status: string): number {
  switch (status) {
    case "queued":
      return 0;
    case "running":
      return 50;
    case "completed":
      return 100;
    case "failed":
      return 0;
    default:
      return 0;
  }
}

export async function isHealthy() {
  try {
    if (!uri) return false;
    const client = new MongoClient(uri);
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    await client.close();
    return true;
  } catch {
    return false;
  }
}