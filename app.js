const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const firebaseConfigured = Object.values(config).every((value) => typeof value === "string" && value.length > 0);
let firebaseApi = {};
let auth;
let db;
let storage;
const firebaseReady = (async () => {
  if (!firebaseConfigured) return;
  const [appSdk, authSdk, firestoreSdk, storageSdk] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
    import("firebase/storage"),
  ]);
  firebaseApi = { ...appSdk, ...authSdk, ...firestoreSdk, ...storageSdk };
  ({
    browserLocalPersistence,
    browserSessionPersistence,
    collection,
    createUserWithEmailAndPassword,
    deleteDoc,
    deleteObject,
    doc,
    getBlob,
    getDoc,
    getDocs,
    onAuthStateChanged,
    ref,
    runTransaction,
    sendPasswordResetEmail,
    serverTimestamp,
    setDoc,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    uploadBytes,
  } = firebaseApi);
  const firebaseApp = firebaseApi.initializeApp(config);
  auth = firebaseApi.getAuth(firebaseApp);
  db = firebaseApi.getFirestore(firebaseApp);
  storage = firebaseApi.getStorage(firebaseApp);
})();
let {
  browserLocalPersistence,
  browserSessionPersistence,
  collection,
  createUserWithEmailAndPassword,
  deleteDoc,
  deleteObject,
  doc,
  getBlob,
  getDoc,
  getDocs,
  onAuthStateChanged,
  ref,
  runTransaction,
  sendPasswordResetEmail,
  serverTimestamp,
  setDoc,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  uploadBytes,
} = {};

const $ = (selector) => document.querySelector(selector);
const authScreen = $("#auth-screen");
const appScreen = $("#app-screen");
const authForm = $("#auth-form");
const authError = $("#auth-error");
const submitButton = $("#auth-submit");
const toast = $("#toast");
let selectedRole = "patient";
let isCreatingAccount = true;
let currentUser = null;
let currentProfile = null;
let currentPatient = null;
let currentView = "overview";
let cachedRecords = [];
let searchedPatient = null;
let toastTimer;
let isAuthSubmissionInProgress = false;

const configWarning = $("#config-warning");
if (!firebaseConfigured) {
  configWarning.classList.remove("hidden");
  submitButton.disabled = true;
  $("#forgot-password").disabled = true;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3300);
}

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.remove("hidden");
}

function authMessage(error) {
  const messages = {
    "auth/email-already-in-use": "An account already uses this email. Choose Sign in instead.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Choose a password with at least 8 characters.",
    "auth/invalid-credential": "That email and password combination wasn't recognized.",
    "auth/user-disabled": "This account has been disabled. Contact support for help.",
    "auth/network-request-failed": "A network error interrupted sign-in. Check your connection and try again.",
    "auth/too-many-requests": "Too many attempts. Wait a little while before trying again.",
    "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase Authentication.",
    "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication.",
  };
  return messages[error?.code] || error?.message || "Something went wrong. Please try again.";
}

function friendlyError(error) {
  const messages = {
    "permission-denied": "You don't have permission to do that. Check that the patient has granted access and the provider account is approved.",
    "storage/unauthorized": "This file is not accessible with your current account or sharing permissions.",
    "storage/canceled": "The file upload was canceled.",
    "storage/retry-limit-exceeded": "The file could not be uploaded after several attempts. Please try again.",
    "unavailable": "The service is temporarily unavailable. Check your connection and try again.",
    "not-found": "That record could not be found.",
  };
  const code = error?.code?.replace(/^firestore\//, "");
  return messages[code] || error?.message || "The request could not be completed.";
}

function setAuthBusy(busy, label) {
  submitButton.disabled = busy || !firebaseConfigured;
  submitButton.querySelector("#submit-label").textContent = busy ? "Please wait…" : label;
}

function updateAuthMode() {
  $("#auth-title").textContent = isCreatingAccount ? "Create your profile" : "Welcome back";
  $("#auth-subtitle").textContent = isCreatingAccount ? "Start with your name and a few details." : "Sign in to continue to your health history.";
  $("#submit-label").textContent = isCreatingAccount ? "Create profile & continue" : "Sign in to your account";
  $("#switch-copy").textContent = isCreatingAccount ? "Already have an account?" : "New to Wellnest?";
  $("#switch-auth").textContent = isCreatingAccount ? "Sign in" : "Create an account";
  $("#profile-fields").classList.toggle("hidden", !isCreatingAccount);
  $("#auth-name").required = isCreatingAccount;
  $("#provider-fields").classList.toggle("hidden", selectedRole !== "provider");
  $("#provider-organization").required = selectedRole === "provider" && isCreatingAccount;
  $("#provider-license").required = selectedRole === "provider" && isCreatingAccount;
  $("#provider-notice").classList.toggle("hidden", selectedRole !== "provider");
  $("#forgot-password").classList.toggle("hidden", isCreatingAccount);
  $("#auth-password").autocomplete = isCreatingAccount ? "new-password" : "current-password";
  $("#remember-me").closest("label").classList.toggle("hidden", isCreatingAccount);
  $("#auth-error").classList.add("hidden");
  submitButton.disabled = !firebaseConfigured;
}

function selectRole(role) {
  selectedRole = role;
  $("#patient-tab").classList.toggle("active", role === "patient");
  $("#provider-tab").classList.toggle("active", role === "provider");
  $("#patient-tab").setAttribute("aria-selected", String(role === "patient"));
  $("#provider-tab").setAttribute("aria-selected", String(role === "provider"));
  updateAuthMode();
}

$("#patient-tab").addEventListener("click", () => selectRole("patient"));
$("#provider-tab").addEventListener("click", () => selectRole("provider"));
$("#header-signin").addEventListener("click", () => {
  isCreatingAccount = false;
  updateAuthMode();
  $("#auth-email").focus();
});
$("#switch-auth").addEventListener("click", () => {
  isCreatingAccount = !isCreatingAccount;
  updateAuthMode();
});
$("#toggle-password").addEventListener("click", () => {
  const input = $("#auth-password");
  const visible = input.type === "text";
  input.type = visible ? "password" : "text";
  $("#toggle-password").textContent = visible ? "Show" : "Hide";
  $("#toggle-password").setAttribute("aria-label", visible ? "Show password" : "Hide password");
});
$("#forgot-password").addEventListener("click", async () => {
  const email = $("#auth-email").value.trim();
  if (!email) {
    showAuthError("Enter your email address first, then choose Forgot password.");
    $("#auth-email").focus();
    return;
  }
  try {
    await firebaseReady;
    await sendPasswordResetEmail(auth, email);
    showToast("If an account exists for that email, a password reset link is on its way.");
    authError.classList.add("hidden");
  } catch (error) {
    showAuthError(authMessage(error));
  }
});

function accountDetails() {
  return {
    displayName: $("#auth-name").value.trim(),
    phoneNumber: $("#auth-phone").value.trim(),
    organization: $("#provider-organization").value.trim(),
    licenseNumber: $("#provider-license").value.trim(),
  };
}

function validateAccountCreation(requireDetails = isCreatingAccount) {
  const details = accountDetails();
  if (requireDetails && details.displayName.length < 2) {
    showAuthError("Enter your full name to create your profile.");
    $("#auth-name").focus();
    return false;
  }
  if (selectedRole === "provider" && requireDetails && (!details.organization || !details.licenseNumber)) {
    showAuthError("Enter your clinic or organization and professional license number to request provider verification.");
    return false;
  }
  return true;
}

async function persistAuthChoice() {
  await firebaseReady;
  await setPersistence(auth, $("#remember-me").checked ? browserLocalPersistence : browserSessionPersistence);
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authError.classList.add("hidden");
  if (!validateAccountCreation()) return;
  const email = $("#auth-email").value.trim();
  const password = $("#auth-password").value;
  if (!email || !password) {
    showAuthError("Enter your email address and password.");
    return;
  }
  const profileDetails = accountDetails();
  isAuthSubmissionInProgress = true;
  setAuthBusy(true, "");
  try {
    await persistAuthChoice();
    if (isCreatingAccount) {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: profileDetails.displayName });
      currentProfile = await ensureUserProfile(credential.user, selectedRole, profileDetails);
      await loadWorkspace(credential.user, currentProfile);
    } else {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      currentProfile = await ensureUserProfile(credential.user, selectedRole, profileDetails);
      await loadWorkspace(credential.user, currentProfile);
    }
  } catch (error) {
    showAuthError(error?.code?.startsWith("auth/") ? authMessage(error) : friendlyError(error));
  } finally {
    isAuthSubmissionInProgress = false;
    setAuthBusy(false, isCreatingAccount ? "Create profile & continue" : "Sign in to your account");
  }
});

function newPatientNumber() {
  const year = new Date().getFullYear();
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase();
  return `WN-${year}-${suffix}`;
}

async function ensureUserProfile(user, requestedRole, details = {}) {
  const userRef = doc(db, "users", user.uid);
  const providerDirectoryRef = doc(db, "providerDirectory", user.uid);
  let profile;
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(userRef);
    if (existing.exists()) {
      profile = existing.data();
      return;
    }
    const role = requestedRole === "provider" ? "provider" : "patient";
    profile = {
      uid: user.uid,
      displayName: details.displayName || user.displayName || user.email?.split("@")[0] || "Wellnest member",
      role,
      createdAt: serverTimestamp(),
      ...(role === "provider" ? {
        phoneNumber: details.phoneNumber || "",
        organization: details.organization || "",
        licenseNumber: details.licenseNumber || "",
        providerStatus: "pending",
      } : {
        patientNumber: "",
        phoneNumber: details.phoneNumber || "",
      }),
    };
    transaction.set(userRef, profile);
    if (role === "provider") {
      transaction.set(providerDirectoryRef, {
        providerUid: user.uid,
        displayName: profile.displayName,
        organization: profile.organization,
        providerStatus: "pending",
      });
    }
  });

  if (profile.role === "provider") {
    const directorySnapshot = await getDoc(providerDirectoryRef);
    if (!directorySnapshot.exists()) {
      await setDoc(providerDirectoryRef, {
        providerUid: user.uid,
        displayName: profile.displayName,
        organization: profile.organization || "",
        providerStatus: "pending",
      });
    }
  }

  if (profile.role === "patient" && !profile.patientNumber) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const patientNumber = newPatientNumber();
      const patientRef = doc(db, "patients", patientNumber);
      let collision = false;
      await runTransaction(db, async (transaction) => {
        const [userSnapshot, patientSnapshot] = await Promise.all([
          transaction.get(userRef),
          transaction.get(patientRef),
        ]);
        if (userSnapshot.data()?.patientNumber) {
          profile = userSnapshot.data();
          return;
        }
        if (patientSnapshot.exists()) {
          collision = true;
          return;
        }
        const updatedProfile = { ...userSnapshot.data(), patientNumber };
        profile = updatedProfile;
        transaction.update(userRef, { patientNumber });
        transaction.set(patientRef, {
          ownerUid: user.uid,
          patientNumber,
          displayName: profile.displayName || user.displayName || "Wellnest member",
          healthProfile: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      if (!collision) break;
      if (attempt === 4) throw new Error("We couldn't assign a unique patient number. Please try signing in again.");
    }
  }
  return profile;
}

async function loadWorkspace(user, profile) {
  currentUser = user;
  currentProfile = profile;
  if (profile.role === "patient") {
    if (!profile.patientNumber) throw new Error("Your patient number is still being created. Sign out and sign in again.");
    const patientSnapshot = await getDoc(doc(db, "patients", profile.patientNumber));
    if (!patientSnapshot.exists() || patientSnapshot.data().ownerUid !== user.uid) {
      throw new Error("Your patient profile could not be loaded. Contact support before creating another account.");
    }
    currentPatient = patientSnapshot.data();
  } else {
    currentPatient = null;
  }
  $("#user-name").textContent = profile.displayName || user.displayName || "Wellnest member";
  $("#user-email").textContent = user.email || "";
  $("#user-avatar").textContent = initials(profile.displayName || user.displayName || user.email || "W");
  document.querySelectorAll(".patient-only").forEach((element) => element.classList.toggle("hidden", profile.role !== "patient"));
  document.querySelectorAll(".provider-only").forEach((element) => element.classList.toggle("hidden", profile.role !== "provider"));
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  await openView("overview");
}

function initials(name) {
  return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "W";
}

if (firebaseConfigured) {
  firebaseReady.then(() => onAuthStateChanged(auth, async (user) => {
    if (isAuthSubmissionInProgress) return;
    if (!user) {
      currentUser = null;
      currentProfile = null;
      currentPatient = null;
      appScreen.classList.add("hidden");
      authScreen.classList.remove("hidden");
      return;
    }
    if (currentUser?.uid === user.uid && currentProfile) return;
    try {
      currentProfile = await ensureUserProfile(user, selectedRole);
      await loadWorkspace(user, currentProfile);
    } catch (error) {
      showToast(friendlyError(error));
    }
  })).catch((error) => {
    showAuthError(`Firebase could not be initialized: ${friendlyError(error)}`);
  });
}

$("#signout-button").addEventListener("click", async () => {
  try {
    await firebaseReady;
    await signOut(auth);
    showToast("You have signed out.");
  } catch (error) {
    showToast(friendlyError(error));
  }
});
$("#notification-button").addEventListener("click", () => showToast("You're all caught up."));
$("#help-button").addEventListener("click", () => showToast("For account or data support, contact your Wellnest administrator."));
$("#profile-menu").addEventListener("click", () => {
  if (currentProfile?.role === "patient") openProfileDialog();
  else showToast("Provider accounts are managed by your organization.");
});
document.querySelectorAll("[data-static-link]").forEach((link) => link.addEventListener("click", (event) => {
  event.preventDefault();
  showToast("This page will be available when Wellnest support pages are configured.");
}));

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => openView(button.dataset.view));
});

async function openView(view) {
  currentView = view;
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  const titles = {
    overview: "Overview",
    records: "My records",
    sharing: "Sharing & access",
    "patient-search": "Find a patient",
  };
  $("#breadcrumb-current").textContent = titles[view] || "Overview";
  const content = $("#dashboard-content");
  content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◌</div><h3>Loading your workspace</h3><p>Securely retrieving your health information…</p></div>`;
  try {
    if (view === "overview") await renderOverview(content);
    else if (view === "records") await renderRecords(content);
    else if (view === "sharing") await renderSharing(content);
    else if (view === "patient-search") await renderPatientSearch(content);
  } catch (error) {
    content.innerHTML = `<section class="panel empty-state"><div class="empty-state-icon">!</div><h3>We couldn't load this page</h3><p>${escapeHtml(friendlyError(error))}</p><button class="secondary-button" id="retry-view">Try again</button></section>`;
    $("#retry-view").addEventListener("click", () => openView(view));
  }
}

function todayLong() {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());
}

function formattedDate(value, options = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "Date not provided";
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not provided";
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

function recordIcon(type = "") {
  if (/lab/i.test(type)) return "⌁";
  if (/imag/i.test(type)) return "▧";
  if (/visit/i.test(type)) return "▤";
  if (/prescrip/i.test(type)) return "＋";
  return "▧";
}

function recordClass(type = "") {
  if (/lab/i.test(type)) return "lab";
  if (/imag/i.test(type)) return "imaging";
  if (/visit/i.test(type)) return "visit";
  return "";
}

function renderRecordRow(record, patientNumber) {
  const id = escapeHtml(record.id);
  const title = escapeHtml(record.title || "Untitled record");
  const type = escapeHtml(record.type || "Health record");
  const date = formattedDate(record.recordDate);
  return `<div class="record-row" role="button" tabindex="0" data-record-id="${id}" data-patient-number="${escapeHtml(patientNumber)}">
    <span class="file-icon ${recordClass(record.type)}">${recordIcon(record.type)}</span>
    <span class="record-row-content"><span class="record-title">${title}</span><span class="record-meta">${type}${record.providerName ? ` · ${escapeHtml(record.providerName)}` : ""}</span></span>
    <span class="record-date">${escapeHtml(date)}</span><span class="record-arrow">›</span>
  </div>`;
}

function bindRecordRows(root, patientNumber) {
  root.querySelectorAll(".record-row").forEach((row) => {
    const open = () => openRecordDetail(row.dataset.recordId, patientNumber);
    row.addEventListener("click", open);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

async function getRecords(patientNumber) {
  const snapshot = await getDocs(collection(db, "patients", patientNumber, "records"));
  return snapshot.docs.map((recordDoc) => ({ id: recordDoc.id, ...recordDoc.data() }))
    .sort((a, b) => String(b.recordDate || "").localeCompare(String(a.recordDate || "")));
}

async function renderOverview(root) {
  if (currentProfile.role === "provider") {
    renderProviderOverview(root);
    return;
  }
  cachedRecords = await getRecords(currentProfile.patientNumber);
  $("#record-count").textContent = String(cachedRecords.length);
  const patient = currentPatient || {};
  const health = patient.healthProfile || {};
  const recordsPreview = cachedRecords.slice(0, 4);
  root.innerHTML = `
    <div class="welcome-row"><div><h1>Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${escapeHtml((currentProfile.displayName || "there").split(" ")[0])} <span>✳</span></h1><p>Your health story, all together. Here's where things stand.</p></div><div class="welcome-date">${escapeHtml(todayLong())}</div></div>
    <div class="patient-id-card"><div class="patient-id-icon">♡</div><div><div class="patient-id-label">YOUR WELLNEST PATIENT NUMBER</div><div class="patient-id-number">${escapeHtml(currentProfile.patientNumber)}</div></div><div class="id-card-hint">Your unique identifier across<br />your care journey</div><button class="id-copy" id="copy-patient-id">▣ &nbsp; Copy</button></div>
    <div class="metric-grid">
      <div class="metric-card"><div class="metric-top"><span class="metric-label">Health records</span><span class="metric-icon">▤</span></div><div class="metric-value">${cachedRecords.length}</div><div class="metric-foot">Your reports and visit history</div></div>
      <div class="metric-card"><div class="metric-top"><span class="metric-label">Care providers</span><span class="metric-icon lavender">♡</span></div><div class="metric-value" id="provider-count">—</div><div class="metric-foot">Have access to your records</div></div>
      <div class="metric-card"><div class="metric-top"><span class="metric-label">Health profile</span><span class="metric-icon orange">✳</span></div><div class="metric-value">${health.bloodType || health.dateOfBirth ? "Ready" : "Add details"}</div><div class="metric-foot">A little context goes a long way</div></div>
    </div>
    <div class="dashboard-columns">
      <section class="panel"><div class="panel-header"><div><h3>Recent health records</h3><p>Your latest reports and visit notes</p></div><button class="subtle-link" data-go="records">View all →</button></div>
        ${recordsPreview.length ? `<div class="record-list">${recordsPreview.map((record) => renderRecordRow(record, currentProfile.patientNumber)).join("")}</div>` : `<div class="empty-state"><div class="empty-state-icon">▤</div><h3>Your health story starts here</h3><p>Add a report or visit note to keep your medical history together.</p><button class="primary-button" id="empty-add-record">＋ Add your first record</button></div>`}
      </section>
      <div><section class="panel"><div class="panel-header"><div><h3>Quick actions</h3><p>Keep your health information up to date</p></div></div><div class="quick-actions">
        <button class="action-card" id="quick-add-record"><span class="action-icon">＋</span><span class="action-text"><strong>Add a health record</strong><small>Upload a report or add a visit note</small></span><span class="action-chevron">›</span></button>
        <button class="action-card" id="quick-profile"><span class="action-icon">♡</span><span class="action-text"><strong>Update health profile</strong><small>Allergies, conditions and more</small></span><span class="action-chevron">›</span></button>
        <button class="action-card" id="quick-sharing"><span class="action-icon">↗</span><span class="action-text"><strong>Manage sharing</strong><small>Choose which providers can view</small></span><span class="action-chevron">›</span></button>
      </div></section>
      <div class="consent-note"><span>⌑</span><p><strong>Your health information stays yours.</strong> Only providers you authorize can see your records. You can revoke access at any time.</p></div></div>
    </div>
    <section class="panel section-panel"><div class="panel-header"><div><h3>Your health profile</h3><p>Only share what feels right for you.</p></div><button class="subtle-link" id="edit-health-profile">Edit profile →</button></div><div class="patient-info-grid" style="padding:14px 16px;margin:0;border:0">
      <div><span>Blood type</span><strong>${escapeHtml(health.bloodType || "Not provided")}</strong></div>
      <div><span>Allergies</span><strong>${escapeHtml(health.allergies || "Not provided")}</strong></div>
      <div><span>Emergency contact</span><strong>${escapeHtml(health.emergencyContactName || "Not provided")}</strong></div>
    </div></section>`;
  bindRecordRows(root, currentProfile.patientNumber);
  root.querySelector("#copy-patient-id").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(currentProfile.patientNumber);
      showToast("Patient number copied.");
    } catch {
      showToast(`Your patient number is ${currentProfile.patientNumber}`);
    }
  });
  root.querySelectorAll("#quick-add-record,#empty-add-record").forEach((button) => button.addEventListener("click", () => openRecordDialog()));
  root.querySelectorAll("#quick-profile,#edit-health-profile").forEach((button) => button.addEventListener("click", openProfileDialog));
  root.querySelector("#quick-sharing").addEventListener("click", () => openView("sharing"));
  root.querySelector("[data-go='records']")?.addEventListener("click", () => openView("records"));
  try {
    const access = await getDocs(collection(db, "patients", currentProfile.patientNumber, "access"));
    const count = access.docs.length;
    $("#provider-count").textContent = String(count);
  } catch (error) {
    $("#provider-count").textContent = "—";
    showToast(friendlyError(error));
  }
}

function renderProviderOverview(root) {
  const approved = currentProfile.providerStatus === "approved";
  root.innerHTML = `
    <div class="welcome-row"><div><h1>Welcome, ${escapeHtml((currentProfile.displayName || "provider").split(" ")[0])}</h1><p>Your workspace for patient-authorized health records.</p></div><div class="welcome-date">${escapeHtml(todayLong())}</div></div>
    <section class="provider-welcome"><div class="welcome-row"><div><h2>${approved ? "Your provider workspace is ready" : "Provider verification in progress"}</h2><p>${approved ? "Patients can share their Wellnest records with you using your provider code. You can only view a patient's history after they grant access." : "Your account has been created, but patient records remain unavailable until an administrator verifies your professional details."}</p></div><span class="status-tag ${approved ? "approved" : ""}">${approved ? "Verified provider" : "Pending verification"}</span></div>
    ${approved ? `<div class="provider-code">YOUR PROVIDER CODE <strong>${escapeHtml(currentUser.uid)}</strong><button class="id-copy" id="copy-provider-code">Copy code</button></div>` : `<div class="status-banner">Your verification request for <strong>${escapeHtml(currentProfile.organization || "your organization")}</strong> is pending. Contact your Wellnest administrator to complete approval. Your license information is stored privately with your account.</div>`}
    </section>
    ${approved ? `<section class="panel section-panel"><div class="panel-header"><div><h3>Getting started</h3><p>Patient records are available only with explicit patient permission.</p></div><button class="primary-button" id="provider-find-patient">Find a patient <span>→</span></button></div><div class="empty-state"><div class="empty-state-icon">⌕</div><h3>Search with a patient number</h3><p>Ask your patient for their Wellnest number. They must grant access to your provider code before any information is shown.</p></div></section>` : ""}
    <div class="consent-note"><span>⌑</span><p>Access is protected by patient consent and provider verification. Do not request a patient's identifier unless you are providing their care.</p></div>`;
  root.querySelector("#provider-find-patient")?.addEventListener("click", () => openView("patient-search"));
  root.querySelector("#copy-provider-code")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(currentUser.uid);
      showToast("Provider code copied.");
    } catch {
      showToast(`Provider code: ${currentUser.uid}`);
    }
  });
}

async function renderRecords(root) {
  cachedRecords = await getRecords(currentProfile.patientNumber);
  $("#record-count").textContent = String(cachedRecords.length);
  root.innerHTML = `<div class="section-title-row"><div><h1>My health records</h1><p>A timeline of reports, visits, and important health documents.</p></div><button class="primary-button" id="records-add">＋ Add a record</button></div>
    <section class="panel"><div class="panel-header"><div><h3>All records <span class="nav-count">${cachedRecords.length}</span></h3><p>Only you and providers you have authorized can view these records.</p></div><div class="records-toolbar"><input id="record-search" type="search" placeholder="Search records…" aria-label="Search records" /><select id="record-filter" aria-label="Filter record type"><option value="">All types</option><option>Lab result</option><option>Imaging</option><option>Visit summary</option><option>Prescription</option><option>Vaccination</option><option>Other</option></select></div></div>
      <div class="record-list" id="all-records">${cachedRecords.length ? cachedRecords.map((record) => renderRecordRow(record, currentProfile.patientNumber)).join("") : `<div class="empty-state"><div class="empty-state-icon">▤</div><h3>No records just yet</h3><p>Add a report or visit note and your health history will start taking shape.</p><button class="primary-button" id="first-record">＋ Add your first record</button></div>`}</div></section>`;
  bindRecordRows(root, currentProfile.patientNumber);
  root.querySelector("#records-add").addEventListener("click", () => openRecordDialog());
  root.querySelector("#first-record")?.addEventListener("click", () => openRecordDialog());
  const filterRecords = () => {
    const term = root.querySelector("#record-search").value.trim().toLowerCase();
    const type = root.querySelector("#record-filter").value;
    const filtered = cachedRecords.filter((record) => (!type || record.type === type) &&
      `${record.title || ""} ${record.type || ""} ${record.providerName || ""} ${record.notes || ""}`.toLowerCase().includes(term));
    const list = root.querySelector("#all-records");
    list.innerHTML = filtered.length ? filtered.map((record) => renderRecordRow(record, currentProfile.patientNumber)).join("") : `<div class="empty-state"><h3>No matching records</h3><p>Try a different search or record type.</p></div>`;
    bindRecordRows(list, currentProfile.patientNumber);
  };
  root.querySelector("#record-search").addEventListener("input", filterRecords);
  root.querySelector("#record-filter").addEventListener("change", filterRecords);
}

async function renderSharing(root) {
  const access = await getDocs(collection(db, "patients", currentProfile.patientNumber, "access"));
  const providers = access.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
  root.innerHTML = `<div class="section-title-row"><div><h1>Sharing &amp; access</h1><p>You choose which verified providers can see your health records.</p></div></div>
    <div class="access-layout"><section class="panel"><div class="panel-header"><div><h3>Providers with access</h3><p>${providers.length} provider${providers.length === 1 ? "" : "s"} can view your records</p></div></div>
      <div class="access-list">${providers.length ? providers.map((provider) => `<div class="access-person"><span class="avatar">${escapeHtml(initials(provider.providerName || provider.organization || "P"))}</span><span><strong>${escapeHtml(provider.providerName || "Healthcare provider")}</strong><small>${escapeHtml(provider.organization || "Verified Wellnest provider")}${provider.grantedAt ? ` · Added ${escapeHtml(formattedDate(provider.grantedAt))}` : ""}</small></span><button class="revoke-button" data-revoke="${escapeHtml(provider.id)}">Revoke</button></div>`).join("") : `<div class="empty-state"><div class="empty-state-icon">♡</div><h3>No providers have access</h3><p>Add a verified provider using their provider code. You can remove access whenever you like.</p></div>`}</div></section>
      <section class="panel"><div class="panel-header"><div><h3>Give a provider access</h3><p>They must have a verified Wellnest provider account.</p></div></div><div class="access-form"><h3>Share with your care team</h3><p>Ask your provider for their unique provider code. Granting access lets them view the health information and documents in your Wellnest record. You can revoke access at any time.</p>
        <form id="grant-access-form"><label for="provider-code-input">Provider code</label><input id="provider-code-input" type="text" required placeholder="Paste provider's code" autocomplete="off" /><p id="sharing-error" class="form-error hidden"></p><button class="primary-button" type="submit">Grant access <span>→</span></button></form></div></section></div>
    <div class="consent-note"><span>⌑</span><p>Patients stay in control. Providers cannot search or browse your history until you explicitly grant them access.</p></div>`;
  root.querySelector("#grant-access-form").addEventListener("submit", grantProviderAccess);
  root.querySelectorAll("[data-revoke]").forEach((button) => button.addEventListener("click", () => revokeProviderAccess(button.dataset.revoke)));
}

async function grantProviderAccess(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const errorNode = form.querySelector("#sharing-error");
  errorNode.classList.add("hidden");
  const providerUid = form.querySelector("#provider-code-input").value.trim();
  if (!providerUid || providerUid.includes("/") || providerUid === currentUser.uid) {
    errorNode.textContent = "Enter the provider code supplied by a verified care professional.";
    errorNode.classList.remove("hidden");
    return;
  }
  const button = form.querySelector("button[type='submit']");
  button.disabled = true;
  try {
    const providerSnapshot = await getDoc(doc(db, "providerDirectory", providerUid));
    if (!providerSnapshot.exists() || providerSnapshot.data().providerStatus !== "approved") {
      throw new Error("That code doesn't belong to an approved Wellnest provider. Check the code with your care team.");
    }
    const provider = providerSnapshot.data();
    await setDoc(doc(db, "patients", currentProfile.patientNumber, "access", providerUid), {
      providerUid,
      providerName: provider.displayName || "Healthcare provider",
      organization: provider.organization || "",
      grantedAt: serverTimestamp(),
    });
    showToast(`Access granted to ${provider.displayName || "your provider"}.`);
    await openView("sharing");
  } catch (error) {
    errorNode.textContent = friendlyError(error);
    errorNode.classList.remove("hidden");
  } finally {
    button.disabled = false;
  }
}

async function revokeProviderAccess(providerUid) {
  if (!window.confirm("Revoke this provider's access to your Wellnest records?")) return;
  try {
    await deleteDoc(doc(db, "patients", currentProfile.patientNumber, "access", providerUid));
    showToast("Provider access revoked.");
    await openView("sharing");
  } catch (error) {
    showToast(friendlyError(error));
  }
}

async function renderPatientSearch(root) {
  if (currentProfile.providerStatus !== "approved") {
    root.innerHTML = `<div class="section-title-row"><div><h1>Find a patient</h1><p>Search only for patients who have shared access with you.</p></div></div><div class="status-banner">Provider verification is pending. You cannot access patient records until a Wellnest administrator approves your account.</div>`;
    return;
  }
  root.innerHTML = `<div class="section-title-row"><div><h1>Find a patient</h1><p>Patient records are available only after they grant you access.</p></div></div>
    <section class="panel"><div class="panel-header"><div><h3>Search with patient number</h3><p>Ask the patient for their Wellnest patient number.</p></div></div><div class="access-form"><form id="patient-search-form"><label for="patient-number-input">Patient number</label><div style="display:flex;gap:8px"><input id="patient-number-input" class="search-input" type="text" required placeholder="WN-2025-XXXXXXXXXX" /><button class="primary-button" type="submit">Search</button></div><p id="patient-search-error" class="form-error hidden"></p></form></div></section>
    <div id="patient-result-container"></div>`;
  root.querySelector("#patient-search-form").addEventListener("submit", searchPatient);
}

async function searchPatient(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const errorNode = form.querySelector("#patient-search-error");
  const resultContainer = $("#patient-result-container");
  errorNode.classList.add("hidden");
  resultContainer.innerHTML = "";
  const patientNumber = form.querySelector("#patient-number-input").value.trim().toUpperCase();
  if (!/^WN-\d{4}-[A-F0-9]{16}$/.test(patientNumber)) {
    errorNode.textContent = "Enter a valid Wellnest patient number (WN-year-16 characters).";
    errorNode.classList.remove("hidden");
    return;
  }
  const button = form.querySelector("button[type='submit']");
  button.disabled = true;
  try {
    const snapshot = await getDoc(doc(db, "patients", patientNumber));
    if (!snapshot.exists()) {
      resultContainer.innerHTML = `<div class="status-banner">No patient was found with that number. Confirm the number with the patient and try again.</div>`;
      return;
    }
    searchedPatient = { number: patientNumber, ...snapshot.data() };
    const records = await getRecords(patientNumber);
    renderPatientResult(resultContainer, searchedPatient, records);
  } catch (error) {
    if (error?.code === "permission-denied" || error?.code === "firestore/permission-denied") {
      errorNode.textContent = "You don't have access to this patient. Ask them to grant access using your provider code.";
    } else {
      errorNode.textContent = friendlyError(error);
    }
    errorNode.classList.remove("hidden");
  } finally {
    button.disabled = false;
  }
}

function renderPatientResult(root, patient, records) {
  const health = patient.healthProfile || {};
  root.innerHTML = `<section class="panel section-panel"><div class="panel-header"><div><h3>Patient health history</h3><p>Shared by the patient · ${records.length} record${records.length === 1 ? "" : "s"}</p></div><span class="status-tag approved">Access granted</span></div>
    <div class="patient-result"><h3>${escapeHtml(patient.displayName || "Wellnest patient")}</h3><p>Patient number ${escapeHtml(patient.patientNumber || patient.number)}</p>
      <div class="patient-info-grid"><div><span>Date of birth</span><strong>${escapeHtml(health.dateOfBirth ? formattedDate(health.dateOfBirth) : "Not provided")}</strong></div><div><span>Blood type</span><strong>${escapeHtml(health.bloodType || "Not provided")}</strong></div><div><span>Allergies</span><strong>${escapeHtml(health.allergies || "Not provided")}</strong></div></div>
      ${health.conditions ? `<p><strong>Conditions / history:</strong> ${escapeHtml(health.conditions)}</p>` : ""}
      ${health.emergencyContactName ? `<p><strong>Emergency contact:</strong> ${escapeHtml(health.emergencyContactName)} ${health.emergencyContactPhone ? `· ${escapeHtml(health.emergencyContactPhone)}` : ""}</p>` : ""}
      <div class="panel-header" style="padding:12px 0"><div><h3>Records</h3><p>Patient records are read-only. You can add a clinical note or report.</p></div><button class="primary-button" id="provider-add-record">＋ Add record</button></div>
      <div class="record-list" id="patient-record-list">${records.length ? records.map((record) => renderRecordRow(record, patient.number)).join("") : `<div class="empty-state"><p>No records have been added yet.</p></div>`}</div>
    </div></section>`;
  bindRecordRows(root, patient.number);
  root.querySelector("#provider-add-record").addEventListener("click", () => openRecordDialog(patient));
}

function openRecordDialog(patient = null) {
  const dialog = $("#record-dialog");
  const form = $("#record-form");
  form.reset();
  $("#record-date").value = new Date().toISOString().slice(0, 10);
  $("#record-error").classList.add("hidden");
  dialog.dataset.patientNumber = patient?.number || currentProfile.patientNumber;
  dialog.dataset.providerMode = patient ? "true" : "false";
  dialog.querySelector(".modal-heading h2").textContent = patient ? `Add a record for ${patient.displayName || "patient"}` : "Add a health record";
  dialog.querySelector(".modal-heading p").textContent = patient ? "Add a care note or document to this patient's shared history." : "Keep a report or visit note with your health history.";
  dialog.showModal();
}

$("#record-dialog .modal-dismiss").addEventListener("submit", () => $("#record-dialog").close());
$("#cancel-record").addEventListener("click", () => $("#record-dialog").close());
$("#record-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const errorNode = $("#record-error");
  errorNode.classList.add("hidden");
  const title = $("#record-title").value.trim();
  const date = $("#record-date").value;
  if (!title || !date) {
    errorNode.textContent = "Add a title and date before saving.";
    errorNode.classList.remove("hidden");
    return;
  }
  const file = $("#record-file").files[0];
  const allowedTypes = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);
  if (file && (file.size > 20 * 1024 * 1024 || !allowedTypes.has(file.type))) {
    errorNode.textContent = file.size > 20 * 1024 * 1024
      ? "That file is larger than 20 MB. Choose a smaller PDF or Word document."
      : "Choose a PDF or Word document (.pdf, .doc, or .docx).";
    errorNode.classList.remove("hidden");
    return;
  }
  const saveButton = $("#save-record");
  saveButton.disabled = true;
  saveButton.innerHTML = "Saving securely…";
  let uploadedFilePath = "";
  try {
    const patientNumber = $("#record-dialog").dataset.patientNumber;
    const isProvider = $("#record-dialog").dataset.providerMode === "true";
    const recordRef = doc(collection(db, "patients", patientNumber, "records"));
    let filePath = "";
    let fileName = "";
    if (file) {
      filePath = `records/${patientNumber}/${recordRef.id}/${crypto.randomUUID()}-${file.name.replace(/[\\/]/g, "_")}`;
      uploadedFilePath = filePath;
      fileName = file.name;
      await uploadBytes(ref(storage, filePath), file, { contentType: file.type });
    }
    await setDoc(recordRef, {
      title,
      type: $("#record-type").value,
      recordDate: date,
      providerName: $("#record-provider").value.trim() || (isProvider ? currentProfile.organization || currentProfile.displayName : ""),
      notes: $("#record-notes").value.trim(),
      filePath,
      fileName,
      ownerUid: isProvider ? searchedPatient.ownerUid : currentUser.uid,
      createdBy: currentUser.uid,
      createdByName: currentProfile.displayName || "",
      createdAt: serverTimestamp(),
    });
    $("#record-dialog").close();
    showToast("Health record saved.");
    if (isProvider) {
      const refreshed = await getRecords(patientNumber);
      renderPatientResult($("#patient-result-container"), searchedPatient, refreshed);
    } else {
      await openView(currentView);
    }
  } catch (error) {
    let message = friendlyError(error);
    if (uploadedFilePath) {
      try {
        await deleteObject(ref(storage, uploadedFilePath));
      } catch (cleanupError) {
        message += ` The uploaded file could not be cleaned up: ${friendlyError(cleanupError)}`;
      }
    }
    errorNode.textContent = message;
    errorNode.classList.remove("hidden");
  } finally {
    saveButton.disabled = false;
    saveButton.innerHTML = "Save record <span>→</span>";
  }
});

async function openRecordDetail(recordId, patientNumber) {
  const dialog = $("#detail-dialog");
  dialog.innerHTML = `<div class="modal-heading"><div class="modal-icon">▤</div><div><h2>Loading record…</h2><p>Checking your access securely.</p></div></div>`;
  dialog.showModal();
  try {
    const snapshot = await getDoc(doc(db, "patients", patientNumber, "records", recordId));
    if (!snapshot.exists()) throw new Error("That record could not be found.");
    const record = snapshot.data();
    dialog.innerHTML = `<form method="dialog" class="modal-dismiss"><button class="modal-close" aria-label="Close">×</button></form>
      <div class="modal-heading"><div class="modal-icon">${recordIcon(record.type)}</div><div><h2>${escapeHtml(record.title || "Health record")}</h2><p>${escapeHtml(record.type || "Health record")} · ${escapeHtml(formattedDate(record.recordDate))}</p></div></div>
      <div class="detail-info">${record.providerName ? `Provider / facility: ${escapeHtml(record.providerName)}\n` : ""}${record.createdByName ? `Added by: ${escapeHtml(record.createdByName)}\n` : ""}${record.notes ? `\n${escapeHtml(record.notes)}` : "No additional notes."}</div>
      ${record.filePath ? `<button class="primary-button" id="download-record">Download ${escapeHtml(record.fileName || "attached document")}</button>` : `<p class="muted-copy">No document is attached to this record.</p>`}`;
    dialog.querySelector(".modal-dismiss").addEventListener("submit", () => dialog.close());
    dialog.querySelector("#download-record")?.addEventListener("click", () => downloadRecord(record));
  } catch (error) {
    dialog.innerHTML = `<form method="dialog" class="modal-dismiss"><button class="modal-close" aria-label="Close">×</button></form><div class="empty-state"><div class="empty-state-icon">!</div><h3>Record unavailable</h3><p>${escapeHtml(friendlyError(error))}</p></div>`;
    dialog.querySelector(".modal-dismiss").addEventListener("submit", () => dialog.close());
  }
}

async function downloadRecord(record) {
  try {
    const blob = await getBlob(ref(storage, record.filePath));
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = record.fileName || "health-record";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    showToast(friendlyError(error));
  }
}

function openProfileDialog() {
  const health = currentPatient?.healthProfile || {};
  $("#profile-blood").value = health.bloodType || "";
  $("#profile-dob").value = health.dateOfBirth || "";
  $("#profile-allergies").value = health.allergies || "";
  $("#profile-conditions").value = health.conditions || "";
  $("#profile-emergency-name").value = health.emergencyContactName || "";
  $("#profile-emergency-phone").value = health.emergencyContactPhone || "";
  $("#profile-error").classList.add("hidden");
  $("#profile-dialog").showModal();
}

$("#profile-dialog .modal-dismiss").addEventListener("submit", () => $("#profile-dialog").close());
$("#cancel-profile").addEventListener("click", () => $("#profile-dialog").close());
$("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#save-profile");
  const errorNode = $("#profile-error");
  errorNode.classList.add("hidden");
  button.disabled = true;
  try {
    const healthProfile = {
      bloodType: $("#profile-blood").value,
      dateOfBirth: $("#profile-dob").value,
      allergies: $("#profile-allergies").value.trim(),
      conditions: $("#profile-conditions").value.trim(),
      emergencyContactName: $("#profile-emergency-name").value.trim(),
      emergencyContactPhone: $("#profile-emergency-phone").value.trim(),
    };
    await setDoc(doc(db, "patients", currentProfile.patientNumber), {
      healthProfile,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    currentPatient.healthProfile = healthProfile;
    $("#profile-dialog").close();
    showToast("Health profile updated.");
    await openView(currentView);
  } catch (error) {
    errorNode.textContent = friendlyError(error);
    errorNode.classList.remove("hidden");
  } finally {
    button.disabled = false;
  }
});

updateAuthMode();
