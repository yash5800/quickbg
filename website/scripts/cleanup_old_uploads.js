#!/usr/bin/env node
// Simple cleanup script to delete user_uploads older than 1 hour
const { MongoClient } = require("mongodb");

async function main() {
  const uri = process.env.NEXT_MONGODB_URI;
if (!uri || !uri.startsWith('mongodb')) {
  console.error('Invalid or missing MongoDB URI');
  process.exit(2);
}
  if (!uri) {
    console.error("NEXT_MONGODB_URI is not set");
    process.exit(2);
  }

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db("testbgremover");
    const col = db.collection("user_uploads");

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const res = await col.deleteMany({ uploadedAt: { $lt: hourAgo } });
    console.log(`Deleted ${res.deletedCount} old upload record(s)`);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
