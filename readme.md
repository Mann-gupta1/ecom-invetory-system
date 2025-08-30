## Steps to Run the Application
### Clone the repo

### Ensure docker-compose.yml is in the root directory and Docker Desktop is running

Build and Run:

```docker-compose up --build```



### Initialize Data:

Connect to MongoDB:  

` docker exec -it mongo mongosh inventorydb`



Create user, category, and product:

`db.users.insertOne({ username: "testuser" });`

`db.categories.insertOne({ name: "Electronics", description: "Gadgets" });`

`db.products.insertOne({
  name: "Laptop",
  sku: "LAP123",
  price: 999.99,
  stock_quantity: 50,
  category_id: ObjectId("CATEGORY_ID"),
  version: 0
}); `

Access Application:
Open http://localhost:3000 in a browser.


Stop Application:

docker-compose down