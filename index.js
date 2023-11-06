const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

// middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = (await client.connect()).db("blog-post");
    const blogCollection = db.collection("blogs");

    app.get("/api/v1/recent-blogs", async (req, res) => {
      const result = await blogCollection
        .find()
        .sort({ addedTime: 1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.post("/api/v1/add-blog", async (req, res) => {
      const body = req.body;
      const result = await blogCollection.insertOne(body);
      res.status(200).send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World! Welcome!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});