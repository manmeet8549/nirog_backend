const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
});


// Signup Form
document.querySelector('.sign-up-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = e.target.querySelector('input[placeholder="Username"]').value;
  const email = e.target.querySelector('input[placeholder="Email"]').value;
  const password = e.target.querySelector('input[placeholder="Password"]').value;

  const res = await fetch('http://localhost:3000/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();
  
  // Show the message/error from the server first
  alert(data.message || data.error); 
  
  // Only redirect if the HTTP response status was successful (200-299)
  if (res.ok) { 
    window.location.href = 'index.html'; 
  }
});


// Login Form (No changes needed, this logic is correct)
const loginForm = document.querySelector('.sign-in-form');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = loginForm.querySelector('input[placeholder="Username"]').value;
  const password = loginForm.querySelector('input[placeholder="Password"]').value;

  const res = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  alert(data.message || data.error);

  if (res.ok) {
    //Save username in localStorage after successful login
    localStorage.setItem('username', username);
    // Optional: Redirect to index.html
    window.location.href = 'index.html';
  }
});



const username = localStorage.getItem('username');

async function addToCart(product) {
  const res = await fetch('http://localhost:3000/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, item: product })
  });
  const data = await res.json();
  alert(data.message);
}

async function fetchCart() {
  const res = await fetch(`http://localhost:3000/api/cart/${username}`);
  const items = await res.json();
  console.log(items);
}
