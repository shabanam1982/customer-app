# Customer App

A small full-stack app: React page → FastAPI server → PostgreSQL database.

## Features
- List and add customers
- Input checks on the page and on the server
- Parameterised SQL queries (protects against SQL injection)
- Save button cannot be double-clicked (prevents duplicate records)
- Clear messages when the server cannot be reached

## How to run
1. Create a PostgreSQL database called `codingle` with a `customers` table (id, name).
2. Copy `.env.example` to `.env` and add your database password.
3. Backend: `python -m pip install fastapi uvicorn "psycopg[binary]" python-dotenv`
   then `python -m uvicorn db_app:app --reload`
4. Frontend: `cd frontend`, `npm install`, `npm run dev`
5. Open http://localhost:5173