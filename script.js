import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔑 Admin PIN
const ADMIN_PIN = "202603";

// 🧸 Default image for gifts
const DEFAULT_IMAGE =
  "https://png.pngtree.com/png-clipart/20250116/original/pngtree-baby-boy-shower-celebration-with-gifts-and-balloons-png-image_19124496.png";

// 🔥 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBGb6vppg8yrs6RS0ihoIyrxhkKX5oU59U",
  authDomain: "leander-gift-registry-9905b.firebaseapp.com",
  projectId: "leander-gift-registry-9905b",
  storageBucket: "leander-gift-registry-9905b.firebasestorage.app",
  messagingSenderId: "119116512037",
  appId: "1:119116512037:web:4831c5a4dc15b63fbf38cc",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elements
const itemsGrid = document.getElementById("itemsGrid");
const addSection = document.getElementById("addSection");
const addOwnGiftSection = document.getElementById("addOwnGiftSection");
const adminToggle = document.getElementById("adminToggle");
const addOwnGiftToggle = document.getElementById("addOwnGiftToggle");
const addForm = document.getElementById("addForm");
const addOwnGiftForm = document.getElementById("addOwnGiftForm");
const cancelAdd = document.getElementById("cancelAdd");
const cancelOwnGift = document.getElementById("cancelOwnGift");
const loader = document.getElementById("loader");
const adminBanner = document.getElementById("adminBanner");
const exitAdminBtn = document.getElementById("exitAdminBtn");

let isAdmin = false;

// Loader helpers
function showLoader() {
  loader.style.display = "flex";
  loader.style.opacity = "1";
}
function hideLoader() {
  loader.style.opacity = "0";
  setTimeout(() => (loader.style.display = "none"), 300);
}

// Admin toggle
adminToggle.addEventListener("click", () => {
  const pin = prompt("Enter admin PIN:");
  if (pin === ADMIN_PIN) {
    isAdmin = true;
    addSection.classList.remove("hidden");
    adminBanner.classList.remove("hidden");
    renderItems();
  } else {
    alert("Wrong PIN (set ADMIN_PIN in script.js).");
  }
});

// Exit admin mode
exitAdminBtn.addEventListener("click", () => {
  isAdmin = false;
  addSection.classList.add("hidden");
  adminBanner.classList.add("hidden");
  renderItems();
});

// Cancel add
cancelAdd.addEventListener("click", () => addSection.classList.add("hidden"));

// Show user "add own gift" form
addOwnGiftToggle.addEventListener("click", () => {
  addOwnGiftSection.classList.toggle("hidden");
});

// Cancel user gift form
cancelOwnGift.addEventListener("click", () => addOwnGiftSection.classList.add("hidden"));

// 🧸 Add gift by admin
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const price = document.getElementById("price").value.trim();
  const image = document.getElementById("image").value.trim() || DEFAULT_IMAGE;
  const link = document.getElementById("link").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!name) {
    alert("Please enter a name");
    return;
  }

  try {
    showLoader();
    await addDoc(collection(db, "registryItems"), {
      name,
      price,
      image,
      link,
      description,
      createdAt: serverTimestamp(),
      purchased: false,
      contributedGift: false,
    });
    addForm.reset(); // <-- just reset the form
    // addSection.classList.add("hidden"); <-- remove this line
  } catch (err) {
    alert("Failed to add item: " + err.message);
  } finally {
    hideLoader();
  }
});


// 🎁 Add own (public) gift
addOwnGiftForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ownName = document.getElementById("ownName").value.trim();
  const giftName = document.getElementById("ownGiftName").value.trim();
  const quantity = document.getElementById("ownQuantity").value.trim();
  const description = document.getElementById("ownDescription").value.trim();

  if (!ownName || !giftName) {
    alert("Please fill in your name and what you bought.");
    return;
  }

  try {
    showLoader();
    await addDoc(collection(db, "registryItems"), {
      name: giftName,
      price: "",
      image: DEFAULT_IMAGE,
      link: "",
      description: description || "",
      createdAt: serverTimestamp(),
      purchased: true,
      purchaserName: ownName,
      quantity: quantity || "1",
      contributedGift: true,
    });
    addOwnGiftForm.reset();
    addOwnGiftSection.classList.add("hidden");
  } catch (err) {
    alert("Failed to add your gift: " + err.message);
  } finally {
    hideLoader();
  }
});

// Render items
function renderItems() {
  showLoader();
  const q = query(collection(db, "registryItems"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    itemsGrid.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      itemsGrid.appendChild(cardFromData(id, data));
    });
    hideLoader();
  });
}

// Create gift card
function cardFromData(id, data) {
  const card = document.createElement("div");
  card.className =
    "card bg-white rounded-2xl shadow-md flex flex-col overflow-hidden transition-transform hover:scale-[1.02] border border-blue-100 relative";
  if (data.purchased) card.classList.add("opacity-70");

  const img = document.createElement("img");
  img.src = data.image || DEFAULT_IMAGE;
  img.alt = data.name || "Gift item";
  img.className = "w-full h-48 object-cover";

  const title = document.createElement("h3");
  title.textContent = data.name || "Untitled";
  title.className = "text-lg font-bold text-blue-700 mt-3 px-4";

  const desc = document.createElement("p");
  desc.textContent = data.description || "";
  desc.className = "text-gray-600 text-sm px-4 mt-1 mb-3";

  const meta = document.createElement("div");
  meta.className = "flex flex-col items-center px-4 mb-4 text-center";

  const price = document.createElement("div");
  price.className = "font-semibold text-gray-800 mb-2";
  price.textContent = data.price ? "R " + data.price : "";

  const actions = document.createElement("div");
  actions.className = "flex flex-col gap-2 w-full max-w-[160px]";

  if (data.link && !data.contributedGift) {
    const buy = document.createElement("a");
    buy.href = data.link;
    buy.target = "_blank";
    buy.textContent = "View Item";
    buy.className =
      "bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-2 text-sm rounded-lg transition";
    actions.appendChild(buy);
  }

  if (!data.contributedGift) {
    const buyBtn = document.createElement("button");
    buyBtn.textContent = data.purchased ? "Gekoop 🥳" : "Merk as Gekoop";
    buyBtn.disabled = !!data.purchased;
    buyBtn.className = data.purchased
      ? "bg-gray-400 cursor-not-allowed text-white font-semibold py-1 px-2 text-sm rounded-lg"
      : "bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 text-sm rounded-lg transition";

    buyBtn.addEventListener("click", async () => {
      const purchaser = prompt("Enter your name (so others know who purchased it):");
      if (!purchaser) return alert("Purchase canceled — name required.");
      try {
        showLoader();
        await updateDoc(doc(db, "registryItems", id), {
          purchased: true,
          purchaserName: purchaser,
          purchasedAt: serverTimestamp(),
        });
      } catch (err) {
        alert("Failed to mark purchased: " + err.message);
      } finally {
        hideLoader();
      }
    });
    actions.appendChild(buyBtn);
  }

  if (isAdmin) {
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className =
      "bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 text-sm rounded-lg transition";
    deleteBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this item?")) {
        try {
          showLoader();
          await deleteDoc(doc(db, "registryItems", id));
        } catch (err) {
          alert("Failed to delete item: " + err.message);
        } finally {
          hideLoader();
        }
      }
    });
    actions.appendChild(deleteBtn);
  }

  meta.appendChild(price);
  meta.appendChild(actions);

  card.append(img, title, desc, meta);

  if (data.purchased) {
    const badge = document.createElement("div");
    badge.className =
      "absolute top-3 right-3 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold shadow";
    badge.textContent = data.contributedGift
      ? `🎁 Bygedra deur ${data.purchaserName || "Someone"} (x${data.quantity || 1})`
      : `✓ Gekoop deur ${data.purchaserName || "Someone"}`;
    card.appendChild(badge);
  }

  return card;
}

// Initial load
renderItems();

// 🍼 Dismissible Welcome Card
const welcomeCard = document.getElementById("welcomeCard");
const closeWelcomeCard = document.getElementById("closeWelcomeCard");

if (welcomeCard && closeWelcomeCard) {
  closeWelcomeCard.addEventListener("click", () => {
    welcomeCard.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => welcomeCard.remove(), 300);
  });
}

