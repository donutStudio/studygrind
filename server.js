const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Simulated database (JSON file)
const USERS_FILE = path.join(__dirname, "users.json");

// Helper function to read/write user data
const readUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
const writeUsers = (data) => fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));

// Routes
app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const users = readUsers();
  if (users.find((user) => user.username === username)) {
    return res.status(409).json({ message: "Username already exists." });
  }

  users.push({ username, password });
  writeUsers(users);

  res.status(201).json({ message: "Signup successful!" });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const users = readUsers();
  const user = users.find((user) => user.username === username && user.password === password);

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  res.status(200).json({ message: "Login successful!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Initialize empty users.json if not exists
if (!fs.existsSync(USERS_FILE)) {
  writeUsers([]);
}
