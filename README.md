# Legislative Database Search – Web App

A fast, modern web application for searching a U.S. state legislative acts dataset with keyword filters, state and year constraints, infinite scrolling, and optional semantic keyword expansion.

### Key Features
- Keyword search with chips and suggestions
- Filter by U.S. states and year range
- Infinite scroll with batched fetches
- Dark mode toggle and responsive UI
- Semantic keyword expansion via server-side embeddings (optional)

### Tech Stack
- Frontend: React 19 + TypeScript, Vite 7, TailwindCSS
- UI/UX: Lucide icons, Framer Motion animations
- Backend: Azure Functions (Python)
- Data: Azure Cosmos DB (acts and search_index containers)
- Hosting: Azure Static Web Apps (SPA fallback configured)

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 20+
- npm 10+
- Python 3.10+
- Azure Functions Core Tools (for running the API locally)
- Access to Azure Cosmos DB with the required databases/containers

### 1) Install dependencies
```bash
npm ci
```

### 2) Run the frontend
```bash
npm run dev
```
The app starts on `http://localhost:5173` by default.

### 3) Run the Azure Functions API
The API is located in `api/` and uses Python with the following minimal dependencies:
```
azure-cosmos==4.9.0
numpy==1.24.3
```
Typical local run (from the `website` root):
```bash
# install python deps (use your venv/conda as preferred)
python -m pip install -r api/requirements.txt

# start functions host
func start --script-root api
```
The functions host will expose endpoints such as `http://localhost:7071/api/semantic-search` and `http://localhost:7071/api/search`.

### 4) Frontend-to-API routing in local dev
- The frontend calls relative routes like `/api/semantic-search` and `api/search`.
- When running both Vite and Functions locally, either:
  - Use a Vite proxy to `http://localhost:7071`, or
  - Hit the Functions endpoints directly from the browser if CORS permits.

A simple Vite proxy example (not preconfigured):
```ts
// vite.config.ts (example snippet)
export default defineConfig({
  server: { proxy: { '/api': 'http://localhost:7071' } },
});
```

---

## Environment Configuration
The `api/search` function requires Azure Cosmos DB credentials via environment variables. In Azure, configure these in your Function App settings. For local development, use `local.settings.json` (encrypted values are supported).

Required values:
- `ACCOUNT_URI`: Cosmos DB account URI
- `ACCOUNT_KEY`: Cosmos DB account key
- `COSMOS_DB_NAME`: Database name containing `acts` and `search_index` containers

Example (conceptual; do not commit secrets):
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "ACCOUNT_URI": "https://<your-account>.documents.azure.com:443/",
    "ACCOUNT_KEY": "<your-key>",
    "COSMOS_DB_NAME": "<your-db>"
  }
}
```

Static Web Apps fallback is defined in `staticwebapp.config.json` to rewrite unknown routes to `index.html`.

---

## API Reference

Base path (Azure Functions): `/api`

### POST `/api/search`
Search legislative acts by keywords with optional state and year filters.

Request body:
```json
{
  "states": ["CA", "NY"],
  "from_year": 1990,
  "to_year": 2025,
  "search_keys": ["soybean", "wheat"],
  "offset": 0,
  "limit": 20
}
```
- `search_keys` is required; returns 400 if empty.
- `limit` must be <= 500.

Response (200):
```json
[
  {
    "act_num": "HB-1234",
    "year": 2020,
    "state": "CA",
    "name": "An Act relating to…",
    "link": "https://...",
    "backup_link": "https://statelegislativedata.blob.core.windows.net/raw-data/HB-1234.pdf",
    "relevances": [ { "score": 0.89, "search_key": "soybean" } ]
  }
]
```

Errors:
- 400: missing `search_keys` or invalid `limit`
- 500: unexpected server error

Notes:
- Data is sourced from Cosmos DB containers `search_index` and `acts`.
- Results are ordered by relevance and support pagination via `offset` and `limit`.

### POST `/api/semantic-search`
Semantic keyword expansion and similarity.

Request body (expand mode):
```json
{
  "keywords": ["soybean"],
  "threshold": 0.4,
  "max_results": 10,
  "operation": "expand"
}
```

Response (200):
```json
{
  "expanded_keywords": ["soybean", "soybeans", "soy", "soybean_meal"],
  "original_count": 1,
  "expanded_count": 4,
  "threshold": 0.4
}
```

Request body (similar mode):
```json
{
  "keywords": ["soybean"],
  "threshold": 0.4,
  "max_results": 10,
  "operation": "similar"
}
```

Response (200):
```json
{
  "query": "soybean",
  "similar_keywords": [
    { "keyword": "soybeans", "similarity": 0.92 },
    { "keyword": "soy", "similarity": 0.88 }
  ],
  "threshold": 0.4
}
```

Errors:
- 400: invalid JSON, missing/invalid fields, or bad parameters
- 500: server error

Implementation details:
- Embeddings are precomputed and shipped at `api/semantic-search/precomputed_embeddings.json`.
- If a keyword isn’t found, the service falls back to a simple embedding heuristic.

---

## Production Build & Deployment

### Build the frontend
```bash
npm run build
```
Outputs static assets to `dist/`.

### Azure Static Web Apps + Azure Functions
This project is structured for Azure Static Web Apps hosting with an Azure Functions backend:
- The SPA fallback is configured in `staticwebapp.config.json`.
- The HTTP functions live under `api/`.

Typical deployment flow:
1) Provision an Azure Static Web App with Functions
2) Configure app settings for the Function App (`ACCOUNT_URI`, `ACCOUNT_KEY`, `COSMOS_DB_NAME`)
3) Build and upload the `dist/` folder as the Static Web App artifact
4) Deploy the `api/` folder as the Functions backend

Refer to Azure docs for CI/CD via GitHub Actions or Azure DevOps.

---

## Troubleshooting
- Ensure Cosmos DB credentials are present and correct in environment/app settings
- If CORS issues occur locally, add a Vite proxy to `http://localhost:7071`
- `semantic-search` requires `numpy`; verify Python env and compatible versions
- Verify containers `acts` and `search_index` exist with expected schema

---

## License
Proprietary. All rights reserved to the project owner.

