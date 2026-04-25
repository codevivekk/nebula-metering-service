# AI Deployment & Metering Service

A high-performance NestJS service designed to manage AI model deployments, meter token usage, and provide real-time billing analytics.

## 🚀 1. Setup & Quick Start (< 2 mins)

The application is configured for zero-config local development using SQLite.

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Environment Setup**:
    The service uses a `.env` file (defaults provided). Ensure `PORT=3000` and `DATABASE_URL=database.sqlite`.
3.  **Run Application**:
    ```bash
    npm run start:dev
    ```
4.  **Run E2E Tests**:
    ```bash
    npm run test:e2e
    ```

## 🔧 Quick Testing (curl)

### 1. Create Deployment

```bash
curl -X POST http://localhost:3000/deployments \
  -H "Content-Type: application/json" \
  -d '{"model":"model-a"}'
```

*Copy `deployment_id` from response.*

---

### 2. Check Deployment (after ~10 seconds)

```bash
curl http://localhost:3000/deployments/<deployment_id>
```

*Copy `api_key` when status becomes `ready`.*

---

### 3. Call Completion API

```bash
curl -X POST http://localhost:3000/v1/<deployment_id>/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <api_key>" \
  -d '{"prompt":"Hello world"}'
```

---

### 4. Check Usage

```bash
curl "http://localhost:3000/usage?api_key=<api_key>&group_by=day"
```

---

### 5. Delete Deployment

```bash
curl -X DELETE http://localhost:3000/deployments/<deployment_id>
```

---

## 📊 2. Data Model & Architecture

The system uses a relational model with two core entities to separate **state** from **events**:

### **Deployments Table**
- **Purpose**: Tracks the lifecycle and identity of model instances.
- **Why**: Maintaining a separate state allows us to enforce rules like "cannot call inference on a provisioning/terminated deployment" without scanning millions of usage logs. It stores the `api_key` and `endpoint_url` generated during the "ready" transition.

### **Usage Table**
- **Purpose**: Stores immutable event records for every inference call.
- **Why**: Decoupling usage from the deployment record prevents the deployment table from becoming a write bottleneck. It stores `input_tokens`, `output_tokens`, and `model` at the time of request, ensuring that historical records are accurate even if deployment settings change.
- **Aggregation Support**: Every record includes a `timestamp`. We use optimized SQL queries (indexing on `apiKey` and `timestamp`) to provide rapid aggregation by `day` or `model`.

---

## 📈 3. Scaling to 10,000 req/sec

Scaling a metering service to 10k requests/second requires moving from **Synchronous ACID** to **Asynchronous Eventual Consistency**:

### **Asynchronous Usage Processing (Kafka/SQS)**
In the current implementation, we `await` the usage record before returning the inference response. At 10k req/sec, this would destroy throughput.
- **Strategy**: The API service should push a "UsageEvent" to a high-throughput queue (like **Kafka**) and return the inference result immediately. A fleet of background workers then consumes these events to persist them to the database.

### **Caching (Distributed Redis)**
- **Rate Limiting**: Our current Throttler is in-memory. We would transition to a **Redis-backed Throttler** to share rate-limit counters across all API nodes.
- **Key Validation**: Cache API keys and Deployment status in Redis (TTL-based) to avoid a database lookup for every inference call.

### **Database Strategy**
- **Read/Write Splitting**: Use read-replicas for the `/usage` aggregation API while the primary DB handles high-frequency writes.
- **Sharding/Partitioning**: Partition the `Usage` table by `timestamp` (daily/monthly) or shard by `apiKey`. This ensures that indexes remain manageable and old data can be archived efficiently without impacting hot writes.

---

## ⚖️ 4. Trade-offs

| Decision | Rationale | Production Trade-off |
| :--- | :--- | :--- |
| **SQLite** | Zero-config, single file. | Not suitable for concurrent writes or horizontal scaling. |
| **setTimeout** | Simple way to simulate async provisioning. | If the service restarts during the 10s wait, the deployment stays stuck in `provisioning` forever. |
| **Synchronous Logging** | Guaranteed consistency (metering before response). | Increases inference latency and creates a tight coupling with DB performance. |

---

## 🛠️ 5. Future Improvements

1.  **Background Workers**: Replace `setTimeout` with a persistent task runner (like BullMQ) to ensure state transitions are reliable and resumable.
2.  **Advanced Auth**: Move from static API keys to a JWT-based or OIDC system for better security and user management.
3.  **Distributed Rate Limiting**: Move all counters to Redis to support multi-region horizontal scaling.
4.  **Pricing Versioning**: Allow for historical pricing lookups (e.g., if a price changed on Tuesday, older records should still calculate cost based on Monday's rate).

---

## 🤖 6. AI Usage

This project was developed with **Antigravity**, an agentic AI coding assistant.
- **Role of AI**: Scaffolding the NestJS boilerplate, implementing the mock token calculation logic, and generating the E2E test suites.
- **Human Oversight**: Architectural design (module separation), state machine logic for deployment transitions, and defining the specific billing/pricing rules.
