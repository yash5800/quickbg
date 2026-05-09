after uploading the image it stayed Removing background... 0% forever

- don't need to show recent activites remove it
- remove progress bar show only status waiting(if on queued)/processing/done
- we need the seleted processed image in slider component so user sees the change lik morden sites

webosite logs:
✓ Compiled /_not-found in 1440ms (1309 modules)
 GET /api/queue-status 200 in 2744ms
 GET /uploads 404 in 1614ms
 ✓ Compiled in 167ms (648 modules)
 ○ Compiling / ...
 ✓ Compiled / in 554ms (1373 modules)
 GET / 200 in 660ms
 ✓ Compiled /api/jobs in 103ms (703 modules)
 GET /api/jobs?limit=20 200 in 545ms
 ✓ Compiled /api/result/[job_id] in 77ms (705 modules)
 GET /api/result/undefined 404 in 326ms
 GET /api/jobs?limit=20 200 in 722ms
 GET / 200 in 37ms
 GET /api/jobs?limit=20 200 in 142ms
 GET /api/result/undefined 404 in 292ms
 ✓ Compiled /api/remove-background in 119ms (707 modules)
 POST /api/remove-background 200 in 2359ms
 POST /api/remove-background 200 in 2363ms
 ✓ Compiled /api/status/[job_id] in 62ms (709 modules)
 GET /api/jobs?limit=20 200 in 71ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 1014ms
 GET /api/status/eea7c96a-d528-4baf-b1b8-5348cac933a6 200 in 1084ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 84ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 129ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 168ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 91ms
 GET /api/jobs?limit=20 200 in 129ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 91ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 111ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 142ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 316ms
Jobs API error: [TypeError: fetch failed] {
  [cause]: AggregateError [ECONNREFUSED]: 
      at internalConnectMultiple (node:net:1193:18)
      at afterConnectMultiple (node:net:1783:7) {
    code: 'ECONNREFUSED',
    [errors]: [ [Error], [Error] ]
  }
}
 GET /api/jobs?limit=20 500 in 10ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 282ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 247ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 348ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 103ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 137ms
 GET /api/jobs?limit=20 200 in 161ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 98ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 115ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 352ms
 GET /api/status/38fc727e-3eb0-4ff0-ad89-8cf39ecbc818 200 in 350ms
 GET / 200 in 93ms
 GET /api/jobs?limit=20 200 in 221ms
 GET /api/result/undefined 404 in 161ms
 GET /api/jobs?limit=20 200 in 553ms
 POST /api/remove-background 200 in 3995ms
 POST /api/remove-background 200 in 4009ms
 GET /api/status/20ac9f2e-7c80-4f5c-b596-18bb7c15cc52 200 in 162ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 522ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 102ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 116ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 160ms
 GET /api/jobs?limit=20 200 in 164ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 378ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 131ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 358ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 121ms
 GET /api/jobs?limit=20 200 in 84ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 76ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 218ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 220ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 125ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 137ms
 GET /api/jobs?limit=20 200 in 77ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 190ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 345ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 137ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 146ms
 GET /api/jobs?limit=20 200 in 294ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 105ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 158ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 154ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 352ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 311ms
 GET /api/jobs?limit=20 200 in 334ms
 GET /api/status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c 200 in 280ms
worker logs:
INFO:     Started server process [86114]
INFO:     Waiting for application startup.
Loading model...
Loading weights: 100%|███████████████████████████████████████████████████████████████████████████████████| 586/586 [00:00<00:00, 12708.30it/s]
Model loaded on cpu
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     127.0.0.1:42732 - "GET /jobs?limit=20&skip=0 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59022 - "GET /jobs?limit=20&skip=0 HTTP/1.1" 200 OK
INFO:     127.0.0.1:59022 - "GET /result/undefined HTTP/1.1" 404 Not Found
INFO:     127.0.0.1:48966 - "GET /jobs?limit=20&skip=0 HTTP/1.1" 200 OK
2026-05-09 18:05:10,747 INFO bgremover.worker Saved uploaded input file for job 20ac9f2e-7c80-4f5c-b596-18bb7c15cc52 to /home/yash/Documents/projects/quickbg/worker/uploads/org/20ac9f2e-7c80-4f5c-b596-18bb7c15cc52.png
2026-05-09 18:05:10,758 INFO bgremover.worker Saved uploaded input file for job 5a38bdf4-23ec-44fb-9daa-8d0799a2383c to /home/yash/Documents/projects/quickbg/worker/uploads/org/5a38bdf4-23ec-44fb-9daa-8d0799a2383c.png
INFO:     127.0.0.1:48966 - "POST /remove HTTP/1.1" 202 Accepted
INFO:     127.0.0.1:48982 - "POST /remove HTTP/1.1" 202 Accepted
INFO:     127.0.0.1:48966 - "GET /status/20ac9f2e-7c80-4f5c-b596-18bb7c15cc52 HTTP/1.1" 200 OK
INFO:     127.0.0.1:48982 - "GET /status/5a38bdf4-23ec-44fb-9daa-8d0799a2383c HTTP/1.1" 200 OK
INFO:     127.0.0.1:56566 - "GET /jobs?limit=20&skip=0 HTTP/1.1" 200 OK
INFO:     127.0.0.1:44884 - "GET /jobs?limit=20&skip=0 HTTP/1.1" 200 OK
INFO:     127.0.0.1:46658 - "GET /jobs?limit=20&skip=0 HTTP/1.1" 200 OK
