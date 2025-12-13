from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str

# root endpoints
@app.get("/")
def read_root():
    return {"message": "Hello, World!"}

# retrieve item by id
@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

# create item
@app.post("/items/")
def create_item(item: Item):
    return item