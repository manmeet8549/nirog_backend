const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://manmeetsinghvirdi41_db_user:manmeet8549@clusternirog.ne0dogp.mongodb.net/myShopDB?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

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

// Add item to cart (increment if already exists)
app.post('/api/cart', async (req, res) => {
  const { username, item } = req.body;

  try {
    let cart = await Cart.findOne({ username });

    if (!cart) {
      cart = new Cart({ username, items: [item] });
    } else {
      const productName = item.name.trim().toLowerCase();
      const existingItem = cart.items.find(i => i.name.trim().toLowerCase() === productName);
      if (existingItem) {
        existingItem.quantity += item.quantity;  // Increase quantity
      } else {
        cart.items.push(item);
      }
    }

    await cart.save();
    res.json({ message: 'Item added/updated in cart', cart });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// New API: Update Item Quantity
app.put('/api/cart/:username', async (req, res) => {
  const { username } = req.params;
  const { name, quantity } = req.body;

  try {
    const cart = await Cart.findOne({ username });

    if (cart) {
      const item = cart.items.find(i => i.name === name);
      if (item) {
        item.quantity = quantity;
        await cart.save();
        res.json({ message: 'Cart item updated', cart });
      } else {
        res.status(404).json({ error: 'Item not found in cart' });
      }
    } else {
      res.status(404).json({ error: 'Cart not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// New API: Delete Item From Cart
app.delete('/api/cart/:username/:itemName', async (req, res) => {
  const { username, itemName } = req.params;

  try {
    const cart = await Cart.findOne({ username });

    if (cart) {
      cart.items = cart.items.filter(i => i.name !== itemName);
      await cart.save();
      res.json({ message: 'Item removed from cart', cart });
    } else {
      res.status(404).json({ error: 'Cart not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


//nodemailer setup for sending order confirmation emails

const nodemailer = require("nodemailer");

app.post("/api/order", async (req, res) => {
  const {
    name, mobile, address, landmark,
    district, city, state, pincode,
    cart, total, paymentMethod
  } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "manmeet8549singh@gmail.com",         // ✅ Replace with your Gmail
        pass: "ronq ixzq jduq giko"            // ✅ Replace with Gmail App Password
      }
    });

    const cartItemsHtml = cart.map(item =>
      `<li>${item.name} x ${item.quantity} — ₹${item.price * item.quantity}</li>`
    ).join("");

    const mailOptions = {
      from: '"Nirog Organic Orders" <manmeet8549singh@gmail.com>',
      to: "jagminders2@gmail.com",            // ✅ Your own email to receive order
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
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "Order email sent successfully!" });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ success: false, message: "Failed to send order email." });
  }
});
