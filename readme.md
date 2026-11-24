# Customer App

A full-stack web app for listing and adding customers, deployed on Microsoft Azure with automatic CI/CD.

**Live demo:** https://polite-sky-00f536400.5.azurestaticapps.net

```
Browser → React (Azure Static Web Apps) → FastAPI (Azure App Service) → PostgreSQL (Azure Database for PostgreSQL)
```

## Features

**Dashboard**
- Insight cards: total customers, newest customer, possible duplicate names
- Chart of the most common first letters of customer names
- Search by name and sort by newest, oldest or A to Z
- Coloured initials for each customer, mobile-friendly layout
- Server status badge (online / offline)

**Reliability and data quality**
- Input checks on the page and on the server (Pydantic: 1–100 characters, blank names rejected)
- Save button is disabled while saving, which prevents duplicate records from double-clicks
- Separate, user-friendly messages for "cannot load" and "could not save"

**Security**
- Parameterised SQL queries (protects against SQL injection)
- No secrets in code: the database address is read from environment variables (`.env` locally, App Service settings on Azure)
- CORS allows only the app's own website (`ALLOWED_ORIGINS`)
- Database connections use SSL (`sslmode=require`) and a firewall allow-list
- Deployments use GitHub Actions with OpenID Connect (OIDC) and a managed identity: no deployment passwords stored
- `.gitignore` blocks `.env` and any file with "password" in its name

## Tech stack

| Layer | Technology | Hosting |
| --- | --- | --- |
| Frontend | React (Vite) | Azure Static Web Apps (Free) |
| Backend | Python 3.12, FastAPI, Pydantic, psycopg, gunicorn + uvicorn | Azure App Service, Linux (Free F1) |
| Database | PostgreSQL 17 | Azure Database for PostgreSQL Flexible Server (Burstable B1ms) |
| CI/CD | GitHub Actions | Two pipelines: frontend and backend |

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Health message |
| GET | `/customers` | List all customers |
| GET | `/customers/{id}` | One customer (404 if not found) |
| POST | `/customers` | Add a customer: `{"name": "Asha"}` (201 Created) |

Interactive API docs: add `/docs` to the API address.

## Project structure

```
customer-app/
├── .github/workflows/     # GitHub Actions: deploy backend and frontend
├── frontend/              # React app (Vite)
│   ├── src/App.jsx        # Dashboard page
│   ├── src/App.css        # Design
│   └── .env.production    # Public API address used by the online build
├── db_app.py              # FastAPI backend
├── requirements.txt       # Python packages
├── .env.example           # Example settings (copy to .env)
└── .gitignore
```

`main.py` and `main1.py` are early practice versions without a database.

## Run it on your computer

**1. Database.** Create a PostgreSQL database called `codingle`, then run:

```sql
CREATE TABLE customers (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
```

**2. Settings.** Copy `.env.example` to `.env` and put in your own database password. Never commit `.env`.

**3. Backend** (from the project folder):

```bash
python -m pip install -r requirements.txt
python -m uvicorn db_app:app --reload
```

**4. Frontend** (in a second terminal):

```bash
cd frontend
npm install
npm run dev
```

**5.** Open http://localhost:5173

## Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `.env` locally, App Service settings on Azure | PostgreSQL connection string (secret) |
| `ALLOWED_ORIGINS` | App Service settings | Websites allowed to call the API (comma-separated). Default: localhost |
| `VITE_API_URL` | `frontend/.env.production` | Public address of the API used by the online website |

## Deployment

Every push to `main` runs GitHub Actions:

- **Backend:** installs `requirements.txt`, then deploys to App Service (startup command: `gunicorn -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 db_app:app`)
- **Frontend:** builds `frontend/` and publishes `dist` to Static Web Apps

Note: the Free App Service plan sleeps when idle, so the first request after a quiet period can take up to a minute (cold start).

## Testing checklist

| Test | Expected result |
| --- | --- |
| Add a name | Appears in the list, box clears, green message |
| Empty name or only spaces | "Please type a name first." |
| Database check | New row visible in PostgreSQL |
| API stopped | "Cannot load customers" and "Could not save", no crash |
| API restarted | Data loads again, nothing lost |

## Author

Shabanam Bano Ansari · [GitHub](https://github.com/shabanam1982) · [LinkedIn](https://linkedin.com/in/shabanam1982)
