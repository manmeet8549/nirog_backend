const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

// 1. New: Import SendGrid library
const sgMail = require('@sendgrid/mail'); 

const app = express();

// 2. New: Set the SendGrid API Key using the environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY); 


// Use environment variables for the allowed frontend origin
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ["https://your-frontend.onrender.com"];
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Use environment variable for MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://manmeetsinghvirdi41_db_user:manmeet8549@clusternirog.ne0dogp.mongodb.net/myShopDB?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const cartSchema = new mongoose.Schema({
  username: { type: String, required: true },
  items: [
    {
      name: String,
      quantity: Number,
      price: Number
    }
  ]
});

const User = mongoose.model('User', userSchema);
const Cart = mongoose.model('Cart', cartSchema);

// --- API ROUTES ---

// Signup API
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Cart APIs (unchanged)
app.post('/api/cart', async (req, res) => { /* ... (cart add logic) ... */ });
app.put('/api/cart/:username', async (req, res) => { /* ... (cart update logic) ... */ });
app.delete('/api/cart/:username/:itemName', async (req, res) => { /* ... (cart delete logic) ... */ });


// Order API (Updated to use SendGrid API)
app.post("/api/order", async (req, res) => {
  const {
    name, mobile, address, landmark,
    district, city, state, pincode,
    cart, total, paymentMethod
  } = req.body;

  try {
    // Note: The order details are processed and saved in the database here, 
    // even if the email fails. (The original code didn't save the order 
    // to MongoDB, but that logic should ideally be added here.)

    const cartItemsHtml = cart.map(item =>
      `<li>${item.name} x ${item.quantity} — ₹${item.price * item.quantity}</li>`
    ).join("");

    const msg = {
      // Use environment variables for security and configuration
      to: process.env.ORDER_RECEIVER_EMAIL || "jagminders2@gmail.com", 
      from: process.env.EMAIL_USER || "manmeet8549singh@gmail.com",   // Must be a verified SendGrid sender
      subject: `🛒 New Order from ${name}`,
      html: `
        <h2>New Order Details</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Mobile:</strong> ${mobile}</p>
        <p><strong>Address:</strong> ${address}, ${landmark}, ${district}, ${city}, ${state} - ${pincode}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        <h3>Cart:</h3>
        <ul>${cartItemsHtml}</ul>
        <p><strong>Total:</strong> ₹${total}</p>
      `,
    };

    // 3. New: Use the SendGrid API to send the email (via HTTPS, not blocked SMTP)
    await sgMail.send(msg); 

    res.status(200).json({ success: true, message: "Order email sent successfully!" });
  } catch (error) {
    console.error("Email Error (SendGrid):", error);
    // Send 500 status but include a message for debugging on the frontend
    res.status(500).json({ success: false, message: "Failed to send order email via API. Check Render logs for SendGrid error." });
  }
});


// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});