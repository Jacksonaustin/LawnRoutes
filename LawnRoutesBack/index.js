const express = require('express');
const cors = require('cors');
const dovenv = require('dotenv');
const pool = require('./db'); // Assuming db.js exports the pool
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dovenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get("/",(req, res) => res.send("Welcome to LawnRoutes API"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

//Register a new user
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO USERS (NAME, EMAIL, PASSWORD) VALUES ($1, $2, $3) RETURNING *",
      [NAME, EMAIL, hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    
    // Return user data without password
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, token });

    // Handle any errors that occur during registration
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "USER ALREADY FOUND" });
  }
}); // Add this closing brace to fix the syntax error

//Login an existing user
app.post("/login", async (req, res) => {

  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM USERS WHERE EMAIL = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: "USER NOT FOUND" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "INVALID CREDENTIALS" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Return user data without password
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "INTERNAL SERVER ERROR" });
  }
});

// Middleware to authenticate JWT
function auth(req, res, next){
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "ACCESS DENIED" });
    }
    
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: "INVALID TOKEN" });
    }


}


