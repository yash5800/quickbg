import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("worker/.env")
uri = os.getenv("NEXT_MONGODB_URI")
client = MongoClient(uri)
db = client.get_database("testbgremover")
jobs = db["jobs"]
job = jobs.find_one({"jobId": "aba72179-cbd1-48f7-8dce-c24a81fd8426"})
print(job)
