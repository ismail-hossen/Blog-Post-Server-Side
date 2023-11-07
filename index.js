const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const wishlistCollection = db.collection("wishlists");
    const commentCollection = db.collection("comments");
    // comments apis
    app.get("/api/v1/comments", async (req, res) => {
      const result = await commentCollection.find().toArray();
      res.status(200).send(result);
    });

    app.post("/api/v1/add-comment", async (req, res) => {
      const body = req.body;
      const result = await commentCollection.insertOne(body);
      res.status(200).send(result);
    });

    // blogs apis
    app.get("/api/v1/all-blogs", async (req, res) => {
      const result = await blogCollection.find().toArray();
      res.send(result);
    });

    app.get("/api/v1/blog/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const result = await blogCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/api/v1/recent-blogs", async (req, res) => {
      const result = await blogCollection
        .find()
        .sort({ addedTime: 1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/api/v1/featured-blogs", async (req, res) => {
      const result = await blogCollection
        .aggregate([
          {
            $project: {
              title: 1,
              author: 1,
              wordCount: { $size: { $split: ["$longDescription", " "] } },
            },
          },
          { $sort: { wordCount: -1 } },
          { $limit: 10 },
        ])
        .toArray();
      res.send(result);
    });

    app.post("/api/v1/add-blog", async (req, res) => {
      const body = req.body;
      const result = await blogCollection.insertOne({
        ...body,
        addedTime: Date.now(),
      });
      res.status(200).send(result);
    });

    app.put("/api/v1/update-blog/:id", async (req, res) => {
      const body = req.body;
      const filter = { _id: new ObjectId(req.params.id) };
      const result = await blogCollection.updateOne(filter, {
        $set: body,
      });
      res.status(200).send(result);
    });

    // api for wishlist
    app.get("/api/v1/wishlist", async (req, res) => {
      const email = req.query.email;
      const result = await wishlistCollection.find({ email: email }).toArray();
      res.status(200).send(result);
    });

    app.post("/api/v1/wishlist", async (req, res) => {
      const body = req.body;
      const result = await wishlistCollection.insertOne(body);
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
