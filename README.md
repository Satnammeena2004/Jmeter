# JMeter Performance Test — Login & Dashboard Flow

A performance test that simulates 100 users logging in and accessing a dashboard on a local Node.js server. Built as part of the JMeter post-training assessment.

# Get Code from GitHub 
## 1. Clone the repo and set up the server:
```bash

git clone https://github.com/Satnammeena2004/Jmeter.git jmeter-assessment
cd jmeter-assessment

```

## 2. download the zip file and extract it to your local machine, then navigate to the `simple-node-server` directory and install dependencies:



## 3. Start the server:
```bash
cd simple-node-server
pnpm install
pnpm start

```

## What this tests

Two APIs on a local Express server:

- `POST /api/login` — user logs in, gets a token back
- `GET /api/dashboard` — user accesses dashboard using that token

The dashboard **only runs if login succeeds** and a valid token is captured. That's the whole point — real user flow, not just random requests.

---

## Project Files

```
├── Task.jmx          → JMeter test plan
├── users.csv         → test user credentials
├── result.csv        → raw results from the test run
├── html-reports/     → full HTML report with graphs
└── jmeter.log        → execution log
```




## How to Run

- Make sure your Node.js server is running first,
- Jmeter is installed and in your PATH,
- Then run this command from the project root:

```bash
jmeter -n -t Task.jmx -l result.csv -Jthread=100 -Jloop=5 -Jrampup=10 -e -o html-reports
```

Open `html-reports/index.html` in your browser to see the full report with graphs.

---

## Test Setup

| What | Value |
|---|---|
| Users | 100 concurrent |
| Loops | 5 per user |
| Total requests | 1100 |
| Ramp-up | 10 seconds |
| Think time | 1–3 seconds (between login and dashboard) |
| Test data | 5 users in CSV, recycled across 100 threads |

---

## Results at a Glance

| Metric | Login | Dashboard |
|---|---|---|
| Requests | 500 | 500 |
| Avg response | 5.0ms | 2.6ms |
| 90th percentile | 6ms | 4ms |
| Max response | 133ms | 6ms |
| Errors | 0 | 0 |

**Overall TPS: 50.68 req/sec — Error rate: 0.00%**

Everything passed. All assertions (status code, token, response time < 2000ms) held up across all 1100 requests.

---

## How the Flow Works

```
Thread Group (100 users, ramp-up 10s, loop 5)
  ├── HTTP Header Manager         → Content-Type: application/json (global)
  ├── Users Dataset               → CSV Data Set Config (email, password)
  ├── User Defined Variables      → baseUrl and other variables
  ├── HTTP Cookie Manager         → auto-handles cookies per user
  ├── HTTP Cache Manager          → simulates real browser caching
  │
  └── Transaction Controller      → groups full user session
        ├── Login Controller
        │     ├── Login with ${email}        → POST /api/login
        │     ├── Uniform Random Timer       → think time (disabled)
        │     ├── JSON Extractor             → $.token → ${token}
        │     ├── Is Token Exists Assertion  → validates token in body
        │     ├── Is Response Code 200       → validates HTTP 200
        │     └── Duration Assertion         → response < 2000ms
        │
        ├── Uniform Random Timer             → 1–3s think time between login & dashboard
        │
        └── If Controller: ${token} != ""  → only proceed if login **succeeded**
              └── Dashboard Controller
                    ├── HTTP Header Manager  → Authorization: Bearer ${token}
                    ├── Dashboard for ${email}        → GET /api/dashboard
                    ├── Data Key Appear in Response   → validates "data" key exists
                    ├── Data Field Assertion          → validates response fields
                    ├── Status Code Assertion         → validates HTTP 200
                    └── Duration Assertion            → response < 2000ms
```

Each user logs in, waits a moment, then hits the dashboard with their own token. Simple and realistic.

---

## Test Users

| Email | Password |
|---|---|
| alice@test.com | pass123 |
| bob@test.com | pass123 |
| charlie@test.com | pass123 |
| diana@test.com | pass123 |
| eve@test.com | pass123 |

---

## Conclusion

The server handled 100 concurrent users comfortably — average response under 6ms, zero errors, all assertions passed. The only minor thing worth noting is a few spikes in the 99th percentile (up to ~133ms) right at the start, which is just the cold start when all 100 threads connect at once. Not a real concern.

If this were a production test, next step would be pushing to 500–1000 users to find where response times actually start climbing.