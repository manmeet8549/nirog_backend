const username = localStorage.getItem("username") || "Guest";
const cart = JSON.parse(localStorage.getItem("cart")) || [];

const summaryContainer = document.getElementById("cart-summary");
const totalAmountEl = document.getElementById("total-amount");

let total = parseFloat(localStorage.getItem("cartTotal")) || 0;
cart.forEach(item => {
  const div = document.createElement("div");
  div.className = "item";
  div.innerHTML = `<p>${item.name} x ${item.quantity}</p><p>₹${(item.price * item.quantity).toFixed(2)}</p>`;
  summaryContainer.appendChild(div);
});
totalAmountEl.innerText = total.toFixed(2);


// ✅ SINGLE click handler — user info + payment logic
document.getElementById("pay-button").addEventListener("click", async () => {
  const selectedMethod = document.querySelector('input[name="payment"]:checked').value;

  // Collect user input
  const name = document.getElementById("name").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const address = document.getElementById("address").value.trim();
  const landmark = document.getElementById("landmark").value.trim();
  const district = document.getElementById("district").value.trim();
  const city = document.getElementById("city").value.trim();
  const state = document.getElementById("state").value.trim();
  const pincode = document.getElementById("pincode").value.trim();

  // Basic validation
  if (!name || !mobile || !address || !district || !city || !state || !pincode) {
    alert("Please fill in all required fields.");
    return;
  }

  if (!/^\d{10}$/.test(mobile)) {
    alert("Enter a valid 10-digit mobile number.");
    return;
  }

  if (!/^\d{6}$/.test(pincode)) {
    alert("Enter a valid 6-digit pincode.");
    return;
  }

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  if (total <= 0) {
    alert("Total amount is invalid.");
    return;
  }

  const orderDetails = {
    name,
    mobile,
    address,
    landmark,
    district,
    city,
    state,
    pincode,
    cart,
    total,
    paymentMethod: selectedMethod
  };

  // If COD
  if (selectedMethod === "cod") {
  try {
    const response = await fetch("http://localhost:3000/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderDetails)
    });

    const result = await response.json();

    if (result.success) {
      alert("Order placed successfully. Pay on delivery!");
    } else {
      alert("Order placed, but email failed: " + result.message);
    }

    localStorage.removeItem("cart");
    localStorage.setItem("lastOrder", JSON.stringify({ ...orderDetails, paymentId: null }));
    window.location.href = "index.html";
  } catch (error) {
    console.error("Order submission failed", error);
    alert("Something went wrong while placing the order.");
  }
  return;
}


  // Razorpay checkout
  const options = {
  key: "rzp_test_abc123XYZ", // Replace with your real Razorpay key
  amount: total * 100,
  currency: "INR",
  name: "Nirog Organic",
  description: "Order Payment",
  handler: async function (response) {
    alert("Payment successful! ID: " + response.razorpay_payment_id);
    localStorage.removeItem("cart");

    // Attach payment ID to orderDetails
    const paidOrder = { ...orderDetails, paymentId: response.razorpay_payment_id };

    // Save order locally
    localStorage.setItem("lastOrder", JSON.stringify(paidOrder));

    // Send order to backend to trigger email
    try {
      const res = await fetch("http://localhost:3000/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paidOrder)
      });

      const result = await res.json();
      if (!result.success) {
        console.warn("Payment email failed:", result.message);
      }
    } catch (err) {
      console.error("Payment order send failed", err);
    }

    window.location.href = "index.html";
  },
  prefill: {
    name: name,
    email: "user@example.com",
    contact: mobile
  },
  theme: {
    color: "#606c38"
  }
};

const rzp = new Razorpay(options);
rzp.open();

});
