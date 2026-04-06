const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ─────────────────────────────────────────
// In-memory "users database"
// These are the valid login credentials
// ─────────────────────────────────────────
const USERS = [
  { id: 1, email: "alice@test.com",   password: "pass123", name: "Alice" },
  { id: 2, email: "bob@test.com",     password: "pass123", name: "Bob" },
  { id: 3, email: "charlie@test.com", password: "pass123", name: "Charlie" },
  { id: 4, email: "diana@test.com",   password: "pass123", name: "Diana" },
  { id: 5, email: "eve@test.com",     password: "pass123", name: "Eve" },
];

// Active tokens store: { token → userId }
const activeTokens = {};

// Simple token generator
function generateToken(userId) {
  return `TOKEN_${userId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// ─────────────────────────────────────────
// Middleware: log every request
// ─────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}]  ${req.method}  ${req.path}`);
  next();
});

// ─────────────────────────────────────────
// Middleware: protect dashboard routes
// ─────────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Missing or invalid Authorization header",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!activeTokens[token]) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }

  // Attach user info to request
  req.userId = activeTokens[token];
  next();
}

// ─────────────────────────────────────────
// ROUTE 1:  GET  /
// Health check - just to confirm server is running
// ─────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "JMeter Demo Server is running!",
    endpoints: {
      login:     "POST /api/login",
      dashboard: "GET  /api/dashboard",
      users:     "GET  /api/users",
    },
  });
});

// ─────────────────────────────────────────
// ROUTE 2:  POST  /api/login
// JMeter Assessment Step: Login API
//
// Request body:
//   { "email": "alice@test.com", "password": "pass123" }
//
// Success response (200):
//   { "status": "success", "token": "TOKEN_1_...", "user": { ... } }
//
// Failure response (401):
//   { "status": "error", "message": "Invalid credentials" }
// ─────────────────────────────────────────
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      status: "error",
      message: "email and password are required",
    });
  }

  // Find user
  const user = USERS.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      status: "error",
      message: "Invalid credentials",
    });
  }

  // Generate token and store it
  const token = generateToken(user.id);
  activeTokens[token] = user.id;

  // Return token — JMeter JSON Extractor will grab this
  res.status(200).json({
    status: "success",
    token: token,
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
    },
  });
});

// ─────────────────────────────────────────
// ROUTE 3:  GET  /api/dashboard
// JMeter Assessment Step: Dashboard API (needs token)
//
// Header required:
//   Authorization: Bearer <token>
//
// Success response (200):
//   { "status": "success", "data": { ... } }
// ─────────────────────────────────────────
app.get("/api/dashboard", requireAuth, (req, res) => {
  const user = USERS.find((u) => u.id === req.userId);

  res.status(200).json({
    status: "success",
    data: {
      welcomeMessage: `Welcome back, ${user.name}!`,
      stats: {
        totalOrders:   Math.floor(Math.random() * 100) + 1,
        pendingTasks:  Math.floor(Math.random() * 20),
        notifications: Math.floor(Math.random() * 10),
      },
      lastLogin: new Date().toISOString(),
    },
  });
});

// ─────────────────────────────────────────
// ROUTE 4:  GET  /api/users
// Bonus route - returns all users list (no auth needed)
// Useful to verify the server data
// ─────────────────────────────────────────
app.get("/api/users", (req, res) => {
  res.status(200).json({
    status: "success",
    total: USERS.length,
    data: USERS.map((u) => ({ id: u.id, name: u.name, email: u.email })),
  });
});

// ─────────────────────────────────────────
// ROUTE 5:  POST  /api/logout
// Invalidates the token
// ─────────────────────────────────────────
app.post("/api/logout", requireAuth, (req, res) => {
  const token = req.headers["authorization"].split(" ")[1];
  delete activeTokens[token];

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

// ─────────────────────────────────────────
// Start server
// ─────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log("─────────────────────────────────────────");
  console.log(`  JMeter Demo Server running on port ${PORT}`);
  console.log("─────────────────────────────────────────");
  console.log("  Endpoints:");
  console.log("    GET  http://localhost:3000/");
  console.log("    POST http://localhost:3000/api/login");
  console.log("    GET  http://localhost:3000/api/dashboard");
  console.log("    GET  http://localhost:3000/api/users");
  console.log("    POST http://localhost:3000/api/logout");
  console.log("─────────────────────────────────────────");
  console.log("  Test credentials:");
  console.log("    email:    alice@test.com");
  console.log("    password: pass123");
  console.log("─────────────────────────────────────────");
});