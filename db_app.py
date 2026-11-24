import os                                     # read settings from the computer
import psycopg                                # helper to talk to PostgreSQL
from psycopg.rows import dict_row             # gives rows as {"id": 1, "name": "Asha"}
from dotenv import load_dotenv                # reads the .env file (on your laptop)
from fastapi import FastAPI, HTTPException    # HTTPException = send a proper error
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field         # checks incoming data

load_dotenv()   # on your laptop: load .env. On Azure there is no .env; settings come from Azure.

# The database address. Never written in the code.
DB_URL = os.environ["DATABASE_URL"]

# Which websites may call this API (CORS).
# On your laptop: the default below. On Azure: set ALLOWED_ORIGINS to your React web address.
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,   # only our own React page(s)
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    """Open a connection to the database."""
    return psycopg.connect(DB_URL, row_factory=dict_row)


class CustomerIn(BaseModel):
    """The shape of data we accept when adding a customer."""
    name: str = Field(min_length=1, max_length=100)   # 1 to 100 letters


@app.get("/")
def home():
    return {"message": "Hello, the app is working with PostgreSQL!"}


@app.get("/customers")                        # show all customers
def get_customers():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, name FROM customers ORDER BY id"
        ).fetchall()
    return rows


@app.get("/customers/{customer_id}")          # show one customer
def get_one_customer(customer_id: int):
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, name FROM customers WHERE id = %s",
            (customer_id,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return row


@app.post("/customers", status_code=201)      # add a new customer (201 = "created")
def add_customer(customer: CustomerIn):
    name = customer.name.strip()               # remove spaces at start and end
    if name == "":
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    with get_db() as conn:
        row = conn.execute(
            "INSERT INTO customers (name) VALUES (%s) RETURNING id, name",
            (name,)
        ).fetchone()
    return row
