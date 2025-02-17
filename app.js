var express = require("express");
var path = require("path");
var { MongoClient } = require("mongodb");
var app = express();

let db; // Declare db in the global scope

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// General GET routes for views
app.get("/home", (req, res) => {
  res.render("home");
});

app.get("/registration", (req, res) => {
  res.render("registration", { error: null, success: null });
});

app.get("/", (req, res) => {
  const successMessage = req.query.success || null;
  res.render("login", { error: null, success: successMessage });
});

// Dynamic routes for each view
app.get("/annapurna", (req, res) => {
  res.render("annapurna", { success: null, error: null });
});

app.get("/bali", (req, res) => {
  res.render("bali", { success: null, error: null });
});

app.get("/cities", (req, res) => {
  res.render("cities");
});

app.get("/hiking", (req, res) => {
  res.render("hiking");
});

app.get("/inca", (req, res) => {
  res.render("inca", { success: null, error: null });
});

app.get("/islands", (req, res) => {
  res.render("islands");
});

app.get("/paris", (req, res) => {
  res.render("paris", { success: null, error: null });
});

app.get("/rome", (req, res) => {
  res.render("rome", { success: null, error: null });
});

app.get("/santorini", (req, res) => {
  res.render("santorini", { success: null, error: null });
});

app.get("/searchresults", (req, res) => {
  res.render("searchresults");
});

// MongoDB connection
const uri = "mongodb://127.0.0.1:27017"; // Your MongoDB connection string

MongoClient.connect(uri)
  .then((client) => {
    console.log("Connected to MongoDB");
    db = client.db("myDB"); // Set your database name
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Login route
app.post("/", async (req, res) => {
  const { username, password } = req.body;

  // Check if username or password is empty
  if (!username || !password) {
    return res.render("login", {
      error: "Please fill in both username and password.",
      success: null,
    });
  }

  try {
    const user = await db
      .collection("myCollection")
      .findOne({ username, password });

    if (user) {
      req.app.locals.username = username; // Save username for session management
      res.redirect("/home");
    } else {
      res.render("login", {
        error: "Invalid username or password.",
        success: null,
      });
    }
  } catch (err) {
    console.error("Error during login:", err);
    res.render("login", {
      error: "An error occurred. Please try again.",
      success: null,
    });
  }
});


// Home page
app.get("/home", (req, res) => {
  res.render("home");
});

// Add to Want-to-Go List
app.post("/add-to-wanttogo", async (req, res) => {
  const { location } = req.body;
  const username = req.app.locals.username; // Replace with session or user handling logic

  if (!username) {
    return res.render("login", {
      error: "Please log in first.",
      success: null,
    });
  }

  try {
    const user = await db.collection("myCollection").findOne({ username });

    if (user && user.destinations && user.destinations.includes(location)) {
      return res.render(location, {
        success: null,
        error: "Destination already in your Want-to-Go list!",
      });
    }

    await db
      .collection("myCollection")
      .updateOne({ username }, { $addToSet: { destinations: location } });

    return res.render(location, {
      success: "Destination added successfully!",
      error: null,
    });
  } catch (err) {
    console.error("Error adding to Want-to-Go List:", err);
    return res.render(location, {
      success: null,
      error: "An error occurred. Please try again.",
    });
  }
});

// Want-to-Go List Page
app.get("/wanttogo", async (req, res) => {
  const username = req.app.locals.username;

  if (!username) {
    return res.redirect("/");
  }

  try {
    const user = await db.collection("myCollection").findOne({ username });
    const destinations = user.destinations || [];
    res.render("wanttogo", { destinations });
  } catch (err) {
    console.error("Error fetching destinations:", err);
    res.status(500).send("Error loading list.");
  }
});

// Registration page
app.get("/registration", (req, res) => {
  res.render("registration", { error: null, success: null });
});

app.post("/registration", async (req, res) => {
  const { username, password } = req.body;

  // Check if username or password is empty
  if (!username || !password) {
    return res.render("registration", {
      error: "Both username and password are required.",
      success: null,
    });
  }

  try {
    const existingUser = await db
      .collection("myCollection")
      .findOne({ username });

    if (existingUser) {
      return res.render("registration", {
        error: "Username is already taken.",
        success: null,
      });
    }

    await db
      .collection("myCollection")
      .insertOne({ username, password, destinations: [] });

    res.redirect("/?success=Registration successful! Please log in.");
  } catch (err) {
    console.error("Error during registration:", err);
    res.render("registration", {
      error: "An error occurred. Please try again.",
      success: null,
    });
  }
});

// Search functionality
// Search functionality
app.get('/searchresults', (req, res) => {
  res.render('searchresults', { matchingDestinations: null, notFoundMessage: null });
});

app.post('/searchresults', async (req, res) => {
  const query = req.body.Search;

  if (!query) {
    return res.render('searchresults', {
      matchingDestinations: null,
      notFoundMessage: "Please enter a destination to search."
    });
  }

  try {
    const results = await db
      .collection("myCollection")
      .find({ "destinations.name": { $regex: query, $options: "i" } })
      .project({ destinations: 1, _id: 0 })
      .toArray();

    const matchingDestinations = results.flatMap(result =>
      result.destinations.filter(destination =>
        destination.name.match(new RegExp(query, "i"))
      )
    );

    if (matchingDestinations.length > 0) {
      res.render("searchresults", {
        matchingDestinations,
        notFoundMessage: null
      });
    } else {
      res.render("searchresults", {
        matchingDestinations: [],
        notFoundMessage: "Destination not found."
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});






// Add destinations data to the database
const client = new MongoClient(uri);
const dbInstance = client.db("myDB");
var collection = dbInstance.collection('myCollection');

async function addDestinations() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // Data to insert
    const data = {
      destinations: [
        { name: 'Bali' },
        { name: 'Paris' },
        { name: 'AnnaPurna' },
        { name: 'Rome' },
        { name: 'Inca' },
        { name: 'Santorini' }
      ]
    };

    // Check if the exact data already exists in the collection
    const existingDocument = await collection.findOne(data);

    if (existingDocument) {
      console.log('Destinations already exist in the collection.');
    } else {
      // Insert data into the collection
      const result = await collection.insertOne(data);
      console.log('Document inserted with _id:', result.insertedId);
    }
  } catch (err) {
    console.error('Error adding destinations:', err);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
addDestinations();

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});