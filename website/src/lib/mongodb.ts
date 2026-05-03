import { MongoClient, Db, ObjectId } from "mongodb";

const uri = process.env.NEXT_MONGODB_URI;

interface JobDocument {
  _id?: ObjectId;
  jobId: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  fileName: string;
  sessionId: string;
}

let mongoClient: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB() {
  if (!mongoClient && uri) {
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    db = mongoClient.db("bgremover");
    
    const jobs = db.collection<JobDocument>("jobs");
    await jobs.createIndex({ sessionId: 1, createdAt: -1 });
    await jobs.createIndex({ jobId: 1 }, { unique: true });
  }
  return db;
}

export async function closeDB() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    db = null;
  }
}

export function getJobsCollection(database: Db) {
  return database.collection<JobDocument>("jobs");
}

export async function cleanupOldJobs(daysOld: number = 7) {
  if (!db) {
    await connectDB();
  }
  
  const jobs = getJobsCollection(db!);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  
  const result = await jobs.deleteMany({
    createdAt: { $lt: cutoff },
    status: { $in: ["completed", "failed"] },
  });
  
  return result.deletedCount;
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