from fastapi import FastAPI      # bring in the FastAPI tool

app = FastAPI()                  # create our app

# A small list of customers (later this will come from PostgreSQL)
customers = [
    {"id": 1, "name": "Asha"},
    {"id": 2, "name": "Ravi"},
    {"id": 3, "name": "abc"},	
]

@app.get("/")                    # when someone opens the home address...
def home():
    return {"message": "Hello, the app is working!"}

@app.get("/customers")           # when someone opens /customers...
def get_customers():
    return customers             # ...send back the list

@app.get("/customers/id/{customer_id}")      # e.g. /customers/1
def get_customer_by_id(customer_id: int):
    for c in customers:                   # look at each customer one by one
        if c["id"] == customer_id:        # is this the one we want?
            return c                      # yes, send it back
    return {"error": "Customer not found"}  # nobody matched

@app.get("/customers/name/{customer_name}")     # e.g. /customers/name/abc
def get_customer_by_name(customer_name: str):   # str = text, not a number
    for c in customers:                         # check each customer
        if c["name"].lower() == customer_name.lower():   # compare, ignoring capital letters
            return c                            # found, send it back
    return {"error": "Customer not found"}      # nobody matched