// JD Communication Services - main script
// Replace the placeholders below with your real keys/config before production.

// ---------- CONFIGURATION ----------
// EmailJS: replace these with your EmailJS public key, service ID and template ID.
const EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";
const EMAILJS_SERVICE_ID = "YOUR_EMAILJS_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";

// Firebase config: replace with your project's config (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)
const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};
// -----------------------------------

// Services list (matches user's request)
const SERVICES = [
  { id: "community", title: "Community Certificate", desc: "Issuance of community/caste certificate for official use." },
  { id: "income", title: "Income Certificate", desc: "Proof of household income for subsidies and benefits." },
  { id: "nativity", title: "Nativity Certificate", desc: "Official nativity/ birthplace certificate." },
  { id: "pan", title: "PAN Card Assistance", desc: "Help with PAN card application and corrections." },
  { id: "voter", title: "Voter ID", desc: "Apply or update your voter ID / electoral roll details." },
  { id: "obc", title: "OBC Certificate", desc: "Obtain OBC certificate for reservation and benefits." },
  { id: "pstm", title: "PSTM Certificate", desc: "PSTM certificate assistance and follow-up." }
];

// ----- DOM references -----
const grid = document.getElementById("service-grid");
const modalRoot = document.getElementById("modal-root");
const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");
const themeToggle = document.getElementById("theme-toggle");

// initialize EmailJS
(function(){ emailjs.init(EMAILJS_PUBLIC_KEY); })();

// Initialize Firebase (compat libraries included in index.html)
let db = null;
let storage = null;
function initFirebase(){
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    storage = firebase.storage();
    console.log("Firebase initialized");
  } catch(e){
    console.warn("Firebase init error:", e);
  }
}
initFirebase();

// Build service cards
function createServiceCard(s){
  const el = document.createElement("div");
  el.className = "card service-card";
  el.innerHTML = `
    <h3>${s.title}</h3>
    <p>${s.desc}</p>
    <div class="service-actions">
      <button class="btn primary" data-service="${s.id}">Apply Now</button>
      <button class="btn ghost" data-service-info="${s.id}">More Info</button>
    </div>
  `;
  grid.appendChild(el);
}

SERVICES.forEach(createServiceCard);

// Event delegation for apply buttons
grid.addEventListener("click", (e)=>{
  const btn = e.target.closest("[data-service]");
  if(btn) openServiceModal(btn.dataset.service);
  const info = e.target.closest("[data-service-info]");
  if(info) alert(SERVICES.find(s=>s.id===info.dataset.serviceInfo).desc);
});

// Create and show modal for service request
function openServiceModal(serviceId){
  const service = SERVICES.find(s=>s.id===serviceId);
  if(!service) return;
  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true">
        <h3>Apply: ${service.title}</h3>
        <form id="service-form" class="form-card">
          <input type="text" name="fullName" placeholder="Full name" required>
          <input type="email" name="email" placeholder="Email" required>
          <input type="tel" name="phone" placeholder="Phone number" required>
          <input type="text" name="documentId" placeholder="Aadhar / Reference ID (if any)">
          <label>Upload supporting doc (optional)</label>
          <input type="file" name="supportDoc" accept=".pdf,.jpg,.png,.jpeg">
          <textarea name="notes" rows="4" placeholder="Additional details (address, DOB...)" ></textarea>
          <div class="form-row">
            <button class="btn primary" type="submit">Submit Request</button>
            <button class="btn ghost" type="button" id="cancel-modal">Cancel</button>
            <span id="service-status" class="status"></span>
          </div>
        </form>
      </div>
    </div>
  `;
  document.getElementById("cancel-modal").onclick = ()=> closeModal();
  document.getElementById("modal-backdrop").addEventListener("click", (ev)=>{
    if(ev.target.id==="modal-backdrop") closeModal();
  });
  document.getElementById("service-form").addEventListener("submit", (ev)=>handleServiceSubmit(ev, service));
}

function closeModal(){ modalRoot.innerHTML = ""; }

// Handle service request submission: upload file (optional), save to Firestore, and send EmailJS
async function handleServiceSubmit(e, service){
  e.preventDefault();
  const form = e.target;
  const statusEl = document.getElementById("service-status");
  statusEl.textContent = "Processing...";
  const formData = new FormData(form);

  const data = {
    service: service.title,
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    documentId: formData.get("documentId") || "",
    notes: formData.get("notes") || "",
    createdAt: new Date().toISOString()
  };

  try {
    // If file selected, upload to Firebase Storage
    const fileInput = form.querySelector('input[type="file"]');
    if(fileInput && fileInput.files && fileInput.files[0]){
      if(!storage) throw new Error("Firebase Storage not initialized. Check config.");
      const file = fileInput.files[0];
      const safeName = `${service.id}_${Date.now()}_${file.name}`;
      const storageRef = storage.ref().child('service-uploads/' + safeName);
      const uploadTask = await storageRef.put(file);
      const downloadURL = await uploadTask.ref.getDownloadURL();
      data.attachmentURL = downloadURL;
    }

    // Save to Firestore (if initialized)
    if(db){
      const docRef = await db.collection('service_requests').add(data);
      data.requestId = docRef.id;
    } else {
      console.warn("Firestore not available — skipping DB save.");
    }

    // Send email via EmailJS (provided keys)
    const emailParams = {
      to_email: "jdguru2310@gmail.com",
      service_name: data.service,
      fullname: data.fullName,
      email: data.email,
      phone: data.phone,
      notes: data.notes,
      request_id: data.requestId || "N/A",
      attachment_url: data.attachmentURL || ""
    };

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams);
    statusEl.textContent = "✅ Request submitted! We'll contact you at " + data.email;
    form.reset();
    setTimeout(()=> closeModal(), 2000);
  } catch(err){
    console.error(err);
    statusEl.textContent = "❌ Error: " + (err.message || "Could not submit");
  }
}

// Contact form submit: save to Firestore and send email
contactForm.addEventListener("submit", async (ev)=>{
  ev.preventDefault();
  contactStatus.textContent = "Sending...";
  const name = document.getElementById("contact-name").value.trim();
  const email = document.getElementById("contact-email").value.trim();
  const phone = document.getElementById("contact-phone").value.trim();
  const message = document.getElementById("contact-message").value.trim();

  const doc = { name, email, phone, message, createdAt: new Date().toISOString() };
  try {
    if(db){ await db.collection('contacts').add(doc); }
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: "jdguru2310@gmail.com",
      fullname: name,
      email, phone, message, request_id: "contact-form"
    });
    contactStatus.textContent = "✅ Message sent — thank you!";
    contactForm.reset();
  } catch(e){
    console.error(e);
    contactStatus.textContent = "❌ Error sending message.";
  }
});

// Theme toggle
themeToggle.addEventListener("click", ()=>{
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});
