// script.js
// IMPORTANT: Replace the firebaseConfig object below with the config from your Firebase web app.
// Also set ADMIN_PIN to a PIN you choose (used to toggle the Add Item form).

const ADMIN_PIN = "2026"; // <-- set this before publishing (e.g. "1234")
const FIREBASE_CONFIG_PLACEHOLDER = {
  apiKey: "AIzaSyBGb6vppg8yrs6RS0ihoIyrxhkKX5oU59U",
  authDomain: "leander-gift-registry-9905b.firebaseapp.com",
  projectId: "leander-gift-registry-9905b",
  storageBucket: "leander-gift-registry-9905b.firebasestorage.app",
  messagingSenderId: "119116512037",
  appId: "1:119116512037:web:4831c5a4dc15b63fbf38cc"
};

// ---------- Firebase imports (modular SDK via CDN) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot, query, orderBy,
  doc, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// initialize firebase
const firebaseConfig = FIREBASE_CONFIG_PLACEHOLDER;
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const itemsGrid = document.getElementById("itemsGrid");
const addSection = document.getElementById("addSection");
const adminToggle = document.getElementById("adminToggle");
const addForm = document.getElementById("addForm");
const cancelAdd = document.getElementById("cancelAdd");

let isAdmin = false;           // Admin mode flag
const defaultAddHandler = addForm.onsubmit;  // preserve default add behavior

// Admin toggle: asks for PIN
adminToggle.addEventListener("click", () => {
  const pin = prompt("Enter admin PIN:");
  if (pin === ADMIN_PIN) {
    isAdmin = !isAdmin;
    addSection.classList.toggle("hidden", !isAdmin);
    renderItems();
  } else {
    alert("Wrong PIN (set ADMIN_PIN in script.js).");
  }
});

// Cancel add
cancelAdd.addEventListener("click", () => addSection.classList.add("hidden"));

// Default add handler
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const price = document.getElementById("price").value.trim();
  const image = document.getElementById("image").value.trim();
  const link = document.getElementById("link").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!name) { alert("Please enter a name"); return; }

  try {
    await addDoc(collection(db, "registryItems"), {
      name, price, image, link, description,
      createdAt: serverTimestamp(), purchased: false
    });
    addForm.reset();
    addSection.classList.add("hidden");
  } catch (err) {
    console.error(err);
    alert("Failed to add item: " + err.message);
  }
});

// Render items function (with admin actions)
function renderItems() {
  const q = query(collection(db, "registryItems"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    itemsGrid.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      itemsGrid.appendChild(cardFromData(id, data));
    });
  });
}

// Card creator
function cardFromData(id, data) {
  const card = document.createElement("div");
  card.className = "card bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden transition-transform hover:scale-[1.03] relative";
  if (data.purchased) card.classList.add("opacity-70", "filter", "grayscale");

  // Image
  const img = document.createElement("img");
  img.src = data.image && data.image.length ? data.image : "https://via.placeholder.com/640x360?text=Baby+Gift";
  img.alt = data.name || "Item";
  img.className = "w-full h-48 object-cover";

  // Title
  const title = document.createElement("h3");
  title.textContent = data.name || "Untitled";
  title.className = "text-lg font-bold text-blue-500 mt-3 px-4";

  // Description
  const desc = document.createElement("p");
  desc.textContent = data.description || "";
  desc.className = "text-gray-600 text-sm px-4 mt-1 mb-3";

  // Meta
  const meta = document.createElement("div");
  meta.className = "flex justify-between items-center px-4 mb-4";

  // Price
  const price = document.createElement("div");
  price.className = "font-semibold text-gray-800";
  price.textContent = data.price ? "R " + data.price : "";

  // Actions container
  const actions = document.createElement("div");
  actions.className = "flex gap-2";

  // Buy link button
  if (data.link) {
    const buy = document.createElement("a");
    buy.href = data.link;
    buy.target = "_blank";
    buy.textContent = "Buy";
    buy.className = "px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md font-semibold hover:bg-blue-200 transition";
    actions.appendChild(buy);
  }

  // Mark purchased button
  const buyBtn = document.createElement("button");
  buyBtn.textContent = data.purchased ? "Purchased" : "Mark as purchased";
  buyBtn.disabled = !!data.purchased;
  buyBtn.className = data.purchased
    ? "px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded-md font-semibold cursor-not-allowed"
    : "px-2 py-1 text-xs bg-green-400 text-white rounded-md font-semibold hover:bg-green-500 transition";

  buyBtn.addEventListener("click", async () => {
    const purchaser = prompt("Enter your name (will be recorded as purchaser):");
    if (!purchaser) { alert("Purchase canceled — name required."); return; }
    try {
      const itemRef = doc(db, "registryItems", id);
      await updateDoc(itemRef, { purchased: true, purchaserName: purchaser, purchasedAt: serverTimestamp() });
    } catch (err) {
      console.error(err);
      alert("Failed to mark purchased: " + err.message);
    }
  });

  actions.appendChild(buyBtn);
  meta.appendChild(price);
  meta.appendChild(actions);

  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(meta);

  // Admin Delete buttons
  if (isAdmin) {
    const adminActions = document.createElement("div");
    adminActions.className = "flex gap-2 mt-2 px-4";

    // Delete
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "px-2 py-1 text-xs bg-red-200 text-red-700 rounded-md hover:bg-red-300 font-semibold";
    deleteBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this item?")) {
        try {
          await deleteDoc(doc(db, "registryItems", id));
        } catch (err) {
          console.error(err);
          alert("Failed to delete item: " + err.message);
        }
      }
    });
    adminActions.appendChild(deleteBtn);

    card.appendChild(adminActions);
  }

  // Purchased badge
  if (data.purchased) {
    const badge = document.createElement("div");
    badge.className = "absolute top-3 right-3 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold";
    badge.textContent = `✓ Purchased by ${data.purchaserName || "Someone"}`;
    card.appendChild(badge);
  }

  return card;
}

// Initial render
renderItems();
