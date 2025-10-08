// Toggle nav on hamburger
document.getElementById("hamburger").addEventListener("click", () => {
  document.getElementById("navLinks").classList.toggle("active");
});

// Cart functionality
const cartIcon = document.querySelector('.icon-cart');
const closeBtn = document.querySelector('.close');
const cartTab = document.querySelector('.cartTab');
const cartList = document.querySelector('.listCart');
const cartCount = document.querySelector('.icon-cart span');

let cart = [];

// Open/Close cart
cartIcon.addEventListener('click', () => {
  document.body.classList.add('showCart');
});
closeBtn.addEventListener('click', () => {
  document.body.classList.remove('showCart');
});

document.querySelector('.checkout-button').addEventListener('click', () => {
  window.location.href = 'checkout.html';
});

// Add to cart functionality
function bindAddToCartButtons() {
  document.querySelectorAll('.product-card').forEach(card => {
    const btn = card.querySelector('.add-to-cart');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const name = card.querySelector('h3').innerText.trim();
      const subtitleEl = card.querySelector('.subtitle');
      const subtitle = subtitleEl ? subtitleEl.innerText.trim() : "";
      const image = card.querySelector('img').getAttribute('src');

      const selectEl = card.querySelector('.variant-select');
      let price = 0;
      let weight = "";

      if (selectEl) {
        const option = selectEl.options[selectEl.selectedIndex];
        price = parseFloat(option.value);
        weight = option.dataset.weight || option.innerText;
      } else {
        const priceText = card.querySelector('.price').innerText;
        const priceMatch = priceText.match(/From Rs\.\s*([\d.]+)/);
        price = priceMatch ? parseFloat(priceMatch[1]) : 0;
      }

      if (!price) {
        alert("Invalid price");
        return;
      }

      const existingItem = cart.find(item => item.name === name && item.weight === weight);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ name, subtitle, weight, image, price, quantity: 1 });
      }

      updateCartUI();
    });
  });
}

// Render cart UI
function updateCartUI() {
  cartList.innerHTML = '';
  let totalQty = 0;

  cart.forEach(item => {
    totalQty += item.quantity;
    const itemEl = document.createElement('div');
    itemEl.className = 'item';

    itemEl.innerHTML = `
      <div class="image"><img src="${item.image}"></div>
      <div class="name">
        ${item.name} ${item.weight ? `(${item.weight})` : ""}
        ${item.subtitle ? `<br><small>${item.subtitle}</small>` : ""}
      </div>
      <div class="totalPrice">Rs. ${item.price * item.quantity}</div>
      <div class="quantity">
        <span class="minus">-</span>
        <span>${item.quantity}</span>
        <span class="plus">+</span>
      </div>
    `;

    itemEl.querySelector('.minus').addEventListener('click', () => {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        cart = cart.filter(p => !(p.name === item.name && p.weight === item.weight));
      }
      updateCartUI();
    });

    itemEl.querySelector('.plus').addEventListener('click', () => {
      item.quantity++;
      updateCartUI();
    });

    cartList.appendChild(itemEl);
  });

  cartCount.innerText = totalQty;

  // 🔁 Store cart and total in localStorage
  localStorage.setItem("cart", JSON.stringify(cart));
  localStorage.setItem("cartTotal", totalAmount());
}

function totalAmount() {
  return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

/**
 * Calculates the discount percentage between oldPrice and newPrice.
 * Returns the percentage as an integer string or an empty string if no valid discount.
 */
function calculateDiscountPercentage(oldPrice, newPrice) {
    if (oldPrice && newPrice && oldPrice > newPrice) {
        const discount = ((oldPrice - newPrice) / oldPrice) * 100;
        return `${Math.round(discount)}%`;
    }
    return '';
}

// Load products dynamically
window.addEventListener('DOMContentLoaded', async () => {
  const flourContainer = document.getElementById('flourProducts');
  const oilContainer = document.getElementById('oilProducts');

  try {
    const res = await fetch('products.json');
    const products = await res.json();

    products.forEach(product => {
      const item = document.createElement('div');
      item.className = 'product-card';

      let priceHTML = '';
      let variantSelect = '';
      let discountTag = '';

      // Case 1: Variants are objects (with weight & price)
      if (Array.isArray(product.variants) && typeof product.variants[0] === "object") {
        const firstVar = product.variants[0];
        const discount = calculateDiscountPercentage(firstVar.oldPrice, firstVar.price);
        if (discount) {
            discountTag = `<div class="discount-tag">${discount} OFF</div>`;
        }
        
        priceHTML = `
          <p class="price">
            <span class="old-price">Rs. ${firstVar.oldPrice}</span>
            From Rs. ${firstVar.price}
          </p>
        `;

        variantSelect = `
          <select class="variant-select">
            ${product.variants.map(v => 
              `<option value="${v.price}" data-old="${v.oldPrice}" data-weight="${v.weight}">
                ${v.weight} - Rs. ${v.price}
              </option>`
            ).join('')}
          </select>
        `;
      } 
      // Case 2: Variants are simple strings or single price point
      else {
        const discount = calculateDiscountPercentage(product.oldPrice, product.price);
        if (discount) {
            discountTag = `<div class="discount-tag">${discount} OFF</div>`;
        }
        
        // Use product.oldPrice and product.price for the single variant/default view
        priceHTML = `
          <p class="price">
            ${product.oldPrice ? `<span class="old-price">Rs. ${product.oldPrice}</span>` : ''}
            From Rs. ${product.price}
          </p>
        `;
        variantSelect = product.variants?.length 
          ? `<select class="variant-select">
              ${product.variants.map(v => `<option value="${product.price}">${v} - Rs. ${product.price}</option>`).join('')}
            </select>` 
          : '';
      }

      item.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image">
        ${discountTag} <h3>${product.name}</h3>
        ${product.subtitle ? `<p class="subtitle">${product.subtitle}</p>` : ""}
        ${priceHTML}
        ${variantSelect}
        <button class="add-to-cart">Add to Cart</button>
      `;

      if (product.category === "oil") {
        oilContainer.appendChild(item);
      } else {
        flourContainer.appendChild(item);
      }

      // Update price and discount when variant changes
      const selectEl = item.querySelector('.variant-select');
      if (selectEl) {
        selectEl.addEventListener('change', e => {
          const option = selectEl.options[selectEl.selectedIndex];
          const newPrice = parseFloat(option.value);
          const oldPrice = parseFloat(option.dataset.old || item.dataset.defaultOldPrice); // Fallback for simple variants
          
          item.querySelector('.price').innerHTML = `
            <span class="old-price">Rs. ${oldPrice}</span>
            From Rs. ${newPrice}
          `;
          
          const discount = calculateDiscountPercentage(oldPrice, newPrice);
          const existingDiscountTag = item.querySelector('.discount-tag');
          if (discount) {
              if (existingDiscountTag) {
                  existingDiscountTag.innerText = `${discount} OFF`;
              } else {
                  // Re-insert if it was removed or didn't exist
                  const newDiscountTag = document.createElement('div');
                  newDiscountTag.className = 'discount-tag';
                  newDiscountTag.innerText = `${discount} OFF`;
                  item.insertBefore(newDiscountTag, item.querySelector('h3'));
              }
          } else if (existingDiscountTag) {
              // Remove the tag if there's no discount for the selected variant
              existingDiscountTag.remove();
          }
        });
      }
    });

    bindAddToCartButtons();
  } catch (err) {
    console.error("Error loading products:", err);
  }
});