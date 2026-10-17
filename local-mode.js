const DATABASE_NAME = "wellnest-local-demo";
const ACTIVE_PROFILE_KEY = "wellnest-demo-profile";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_BACKUP_SIZE = 60 * 1024 * 1024;
const RECORD_TYPES = ["Lab result", "Imaging", "Visit summary", "Prescription", "Vaccination", "Other"];
const $ = (selector) => document.querySelector(selector);
let database;
let profile;
let records = [];
let toastTimer;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function notify(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3500);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("profiles", { keyPath: "patientNumber" });
      const recordStore = db.createObjectStore("records", { keyPath: "id" });
      recordStore.createIndex("patientNumber", "patientNumber", { unique: false });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open browser storage."));
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not access browser storage."));
  });
}

function saveToStore(storeName, value) {
  const transaction = database.transaction(storeName, "readwrite");
  const request = transaction.objectStore(storeName).put(value);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Could not save your entry."));
    transaction.onabort = () => reject(transaction.error || new Error("The save was cancelled."));
  });
}

async function readFromStore(storeName, key) {
  return requestResult(database.transaction(storeName).objectStore(storeName).get(key));
}

async function readRecords() {
  const index = database.transaction("records").objectStore("records").index("patientNumber");
  const items = await requestResult(index.getAll(profile.patientNumber));
  return items.sort((a, b) => String(b.recordDate).localeCompare(String(a.recordDate)));
}

function completeTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("The database operation failed."));
    transaction.onabort = () => reject(transaction.error || new Error("The database operation was cancelled."));
  });
}

function newPatientNumber() {
  return `WN-${new Date().getFullYear()}-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}

function showAuthScreen() {
  $("#app-screen").classList.add("hidden");
  $("#auth-screen").classList.remove("hidden");
  $("#auth-title").textContent = "Create your profile";
  $("#auth-subtitle").textContent = "Start with your name and a few details.";
  $("#auth-name").value = "";
  $("#auth-phone").value = "";
  $("#auth-dob").value = "";
  $("#auth-error").classList.add("hidden");
  $("#returning-profile").classList.toggle("hidden", !profile);
  if (profile) {
    $("#continue-profile").textContent = `Continue as ${profile.displayName}`;
  }
}

async function startProfile(event) {
  event.preventDefault();
  const displayName = $("#auth-name").value.trim();
  const phoneNumber = $("#auth-phone").value.trim();
  const dateOfBirth = $("#auth-dob").value;
  const error = $("#auth-error");
  error.classList.add("hidden");
  if (displayName.length < 2) {
    error.textContent = "Enter your name to create a profile.";
    error.classList.remove("hidden");
    $("#auth-name").focus();
    return;
  }
  const button = $("#auth-submit");
  button.disabled = true;
  try {
    profile = {
      patientNumber: newPatientNumber(),
      displayName,
      phoneNumber,
      dateOfBirth,
      healthProfile: {},
      createdAt: new Date().toISOString(),
    };
    await saveToStore("profiles", profile);
    localStorage.setItem(ACTIVE_PROFILE_KEY, profile.patientNumber);
    await openDashboard();
  } catch (storageError) {
    error.textContent = `Profile could not be saved in this browser: ${storageError.message || "storage is unavailable"}`;
    error.classList.remove("hidden");
  } finally {
    button.disabled = false;
  }
}

async function openDashboard() {
  if (!profile) return;
  localStorage.setItem(ACTIVE_PROFILE_KEY, profile.patientNumber);
  $("#auth-screen").classList.add("hidden");
  $("#app-screen").classList.remove("hidden");
  $("#user-name").textContent = profile.displayName;
  $("#user-email").textContent = "Saved in this browser";
  $("#user-avatar").textContent = profile.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  document.querySelectorAll(".patient-only").forEach((item) => item.classList.remove("hidden"));
  document.querySelectorAll(".provider-only").forEach((item) => item.classList.add("hidden"));
  document.querySelector("[data-view='sharing']").classList.add("hidden");
  await openView("overview");
}

function formatDate(date) {
  if (!date) return "Date not provided";
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? "Date not provided"
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

function iconForType(type) {
  if (type === "Lab result") return "⌁";
  if (type === "Imaging") return "▧";
  if (type === "Visit summary") return "▤";
  if (type === "Prescription") return "＋";
  return "▧";
}

function rowHtml(record) {
  return `<div class="record-row" role="button" tabindex="0" data-record-id="${escapeHtml(record.id)}">
    <span class="file-icon">${iconForType(record.type)}</span>
    <span class="record-row-content"><span class="record-title">${escapeHtml(record.title)}</span><span class="record-meta">${escapeHtml(record.type)}${record.providerName ? ` · ${escapeHtml(record.providerName)}` : ""}</span></span>
    <span class="record-date">${escapeHtml(formatDate(record.recordDate))}</span><span class="record-arrow">›</span>
  </div>`;
}

function bindRecordRows(root) {
  root.querySelectorAll("[data-record-id]").forEach((row) => {
    const open = () => openRecord(row.dataset.recordId);
    row.addEventListener("click", open);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

async function openView(view) {
  const root = $("#dashboard-content");
  $("#breadcrumb-current").textContent = view === "records" ? "My records" : "Overview";
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  root.innerHTML = `<div class="empty-state"><div class="empty-state-icon">◌</div><h3>Loading records</h3></div>`;
  try {
    records = await readRecords();
    $("#record-count").textContent = String(records.length);
    if (view === "records") renderRecordList(root);
    else renderOverview(root);
  } catch (error) {
    root.innerHTML = `<section class="panel empty-state"><div class="empty-state-icon">!</div><h3>Could not open your records</h3><p>${escapeHtml(error.message || "Browser storage is not available.")}</p></section>`;
  }
}

function renderOverview(root) {
  const health = profile.healthProfile || {};
  root.innerHTML = `<div class="welcome-row"><div><h1>Welcome, ${escapeHtml(profile.displayName.split(" ")[0])}</h1><p>Your health notes and documents, collected in one place.</p></div><div class="welcome-date">${escapeHtml(new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(new Date()))}</div></div>
    <div class="status-banner">Local browser demo. These entries are not uploaded or backed up, and this profile does not verify your identity. Do not store real medical records here.</div>
    <div class="patient-id-card"><div class="patient-id-icon">♡</div><div><div class="patient-id-label">DEMO PROFILE NUMBER</div><div class="patient-id-number">${escapeHtml(profile.patientNumber)}</div></div><div class="id-card-hint">Saved only in this<br />browser</div><button class="id-copy" id="copy-patient-id">▣ &nbsp; Copy</button></div>
    <div class="metric-grid">
      <div class="metric-card"><div class="metric-top"><span class="metric-label">Health details</span><span class="metric-icon">♡</span></div><div class="metric-value">${health.bloodType || health.allergies ? "Added" : "Optional"}</div><div class="metric-foot">Profile information</div></div>
      <div class="metric-card"><div class="metric-top"><span class="metric-label">Health records</span><span class="metric-icon lavender">▤</span></div><div class="metric-value">${records.length}</div><div class="metric-foot">Notes and documents</div></div>
      <div class="metric-card"><div class="metric-top"><span class="metric-label">Date of birth</span><span class="metric-icon orange">✳</span></div><div class="metric-value" style="font-size:14px">${escapeHtml(profile.dateOfBirth ? formatDate(profile.dateOfBirth) : "Not added")}</div><div class="metric-foot">Optional profile detail</div></div>
    </div>
    <div class="dashboard-columns">
      <section class="panel"><div class="panel-header"><div><h3>Recent records</h3><p>Your latest health notes and files</p></div><button class="subtle-link" id="view-all-records">View all →</button></div>
        ${records.length ? `<div class="record-list">${records.slice(0, 5).map(rowHtml).join("")}</div>` : `<div class="empty-state"><div class="empty-state-icon">▤</div><h3>No records yet</h3><p>Add a visit note or attach a report to get started.</p><button class="primary-button" id="first-record">＋ Add your first record</button></div>`}
      </section>
      <div><section class="panel"><div class="panel-header"><div><h3>Quick actions</h3><p>Manage your demo profile</p></div></div><div class="quick-actions">
        <button class="action-card" id="quick-add-record"><span class="action-icon">＋</span><span class="action-text"><strong>Add a health record</strong><small>Write a note or attach a PDF/Word file</small></span><span class="action-chevron">›</span></button>
        <button class="action-card" id="quick-profile"><span class="action-icon">♡</span><span class="action-text"><strong>Edit profile details</strong><small>Allergies, conditions, and blood type</small></span><span class="action-chevron">›</span></button>
        <button class="action-card" id="export-backup"><span class="action-icon">⇩</span><span class="action-text"><strong>Export a backup</strong><small>Save your profile, records, and files</small></span><span class="action-chevron">›</span></button>
        <button class="action-card" id="import-backup"><span class="action-icon">⇧</span><span class="action-text"><strong>Restore a backup</strong><small>Replace this profile's local entries</small></span><span class="action-chevron">›</span></button>
      </div></section><div class="consent-note"><span>ⓘ</span><p>Your profile and documents stay in this browser. Provider sharing, sign-in security, and backups are not enabled in this demo.</p></div></div>
    </div>
    <section class="panel section-panel"><div class="panel-header"><div><h3>Health profile details</h3><p>Optional information saved on this device.</p></div><button class="subtle-link" id="edit-health-profile">Edit profile →</button></div>
      <div class="patient-info-grid profile-details-grid">
        <div><span>Blood type</span><strong>${escapeHtml(health.bloodType || "Not provided")}</strong></div>
        <div><span>Allergies</span><strong>${escapeHtml(health.allergies || "Not provided")}</strong></div>
        <div><span>Conditions / history</span><strong>${escapeHtml(health.conditions || "Not provided")}</strong></div>
        <div><span>Emergency contact</span><strong>${escapeHtml(health.emergencyContactName || "Not provided")}</strong></div>
        <div><span>Contact phone</span><strong>${escapeHtml(health.emergencyContactPhone || "Not provided")}</strong></div>
        <div><span>Your phone</span><strong>${escapeHtml(profile.phoneNumber || "Not provided")}</strong></div>
      </div>
    </section>`;
  bindRecordRows(root);
  root.querySelector("#first-record")?.addEventListener("click", () => openRecordDialog());
  root.querySelector("#quick-add-record").addEventListener("click", () => openRecordDialog());
  root.querySelector("#quick-profile").addEventListener("click", openProfileDialog);
  root.querySelector("#edit-health-profile").addEventListener("click", openProfileDialog);
  root.querySelector("#export-backup").addEventListener("click", exportBackup);
  root.querySelector("#import-backup").addEventListener("click", () => $("#backup-file").click());
  root.querySelector("#view-all-records").addEventListener("click", () => openView("records"));
  root.querySelector("#copy-patient-id").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(profile.patientNumber);
      notify("Profile number copied.");
    } catch {
      notify(`Demo profile number: ${profile.patientNumber}`);
    }
  });
}

function renderRecordList(root, filter = "") {
  const normalized = filter.toLowerCase();
  const selectedType = root.querySelector("#record-filter")?.value || "";
  const fromDate = root.querySelector("#record-from")?.value || "";
  const toDate = root.querySelector("#record-to")?.value || "";
  const filtered = records.filter((record) =>
    (!selectedType || record.type === selectedType)
    && (!fromDate || record.recordDate >= fromDate)
    && (!toDate || record.recordDate <= toDate)
    && `${record.title} ${record.type} ${record.providerName} ${record.notes}`.toLowerCase().includes(normalized));
  root.innerHTML = `<div class="section-title-row"><div><h1>My health records</h1><p>Notes and documents saved in this browser.</p></div><button class="primary-button" id="records-add">＋ Add a record</button></div>
    <section class="panel"><div class="panel-header"><div><h3>All records <span class="nav-count">${filtered.length}</span></h3><p>Click a record to see its details.</p></div><div class="records-toolbar"><input id="record-search" type="search" placeholder="Search records…" aria-label="Search records" value="${escapeHtml(filter)}" /><select id="record-filter" aria-label="Filter by record type"><option value="">All types</option>${RECORD_TYPES.map((type) => `<option value="${escapeHtml(type)}" ${selectedType === type ? "selected" : ""}>${escapeHtml(type)}</option>`).join("")}</select></div></div>
      <div class="records-date-filters"><label for="record-from">From</label><input id="record-from" type="date" value="${escapeHtml(fromDate)}" /><label for="record-to">To</label><input id="record-to" type="date" value="${escapeHtml(toDate)}" /><button class="subtle-link" id="clear-record-filters">Clear filters</button></div>
      <div class="record-list" id="all-records">${filtered.length ? filtered.map(rowHtml).join("") : `<div class="empty-state"><div class="empty-state-icon">▤</div><h3>${records.length ? "No matching records" : "No records yet"}</h3><p>${records.length ? "Try another search." : "Add a record to start your health history."}</p><button class="primary-button" id="empty-record-add">＋ Add a record</button></div>`}</div></section>
    <div class="record-toolbar-actions"><button class="secondary-button" id="records-export">Export backup</button><button class="secondary-button" id="records-import">Restore backup</button></div>
    <div class="consent-note"><span>ⓘ</span><p>Records and attached files are stored only in this browser profile. This demo is not a secure medical record system.</p></div>`;
  bindRecordRows(root);
  root.querySelector("#records-add").addEventListener("click", () => openRecordDialog());
  root.querySelector("#empty-record-add")?.addEventListener("click", () => openRecordDialog());
  root.querySelector("#records-export").addEventListener("click", exportBackup);
  root.querySelector("#records-import").addEventListener("click", () => $("#backup-file").click());
  root.querySelector("#clear-record-filters").addEventListener("click", () => renderRecordList(root));
  ["#record-search", "#record-filter", "#record-from", "#record-to"].forEach((selector) => {
    root.querySelector(selector).addEventListener(selector === "#record-search" ? "input" : "change", () => {
      const nextFilter = root.querySelector("#record-search").value;
      renderRecordList(root, nextFilter);
      const nextSearch = root.querySelector("#record-search");
      nextSearch.focus();
      nextSearch.setSelectionRange(nextFilter.length, nextFilter.length);
    });
  });
}

function openRecordDialog(record = null) {
  $("#record-form").reset();
  $("#record-error").classList.add("hidden");
  $("#remove-attachment-label").classList.add("hidden");
  $("#record-attachment-state").classList.add("hidden");
  $("#remove-attachment").checked = false;
  $("#record-dialog").dataset.editRecordId = record?.id || "";
  $("#record-dialog .modal-heading h2").textContent = record ? "Edit health record" : "Add a health record";
  $("#record-dialog .modal-heading p").textContent = record ? "Update the saved note or document details." : "Keep a report or visit note with your health history.";
  if (record) {
    $("#record-title").value = record.title;
    $("#record-type").value = record.type;
    $("#record-date").value = record.recordDate;
    $("#record-provider").value = record.providerName || "";
    $("#record-notes").value = record.notes || "";
    if (record.fileName) {
      $("#record-attachment-state").textContent = `Currently attached: ${record.fileName}`;
      $("#record-attachment-state").classList.remove("hidden");
      $("#remove-attachment-label").classList.remove("hidden");
    }
  } else {
    $("#record-date").value = new Date().toISOString().slice(0, 10);
  }
  $("#record-dialog").showModal();
  $("#record-title").focus();
}

$("#auth-form").addEventListener("submit", startProfile);
$("#continue-profile").addEventListener("click", openDashboard);
document.querySelectorAll(".nav-item[data-view='overview'],.nav-item[data-view='records']").forEach((item) => {
  item.addEventListener("click", () => openView(item.dataset.view));
});
$("#signout-button").textContent = "↪  Change profile";
$("#signout-button").addEventListener("click", showAuthScreen);
$("#notification-button").addEventListener("click", () => notify("You are viewing a local browser demo."));
$("#help-button").addEventListener("click", () => notify("Use Add a health record to enter a note or attach a report."));
$("#profile-menu").addEventListener("click", openProfileDialog);
$("#backup-file").addEventListener("change", (event) => importBackup(event.currentTarget.files[0]));
document.querySelector("#record-dialog .modal-dismiss").addEventListener("submit", (event) => {
  event.preventDefault();
  $("#record-dialog").close();
});
$("#cancel-record").addEventListener("click", () => $("#record-dialog").close());
$("#record-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = $("#record-error");
  const file = $("#record-file").files[0] || null;
  const title = $("#record-title").value.trim();
  if (!title) {
    error.textContent = "Enter a title for this record.";
    error.classList.remove("hidden");
    return;
  }
  if (file && file.size > MAX_FILE_SIZE) {
    error.textContent = "Choose a file smaller than 20 MB.";
    error.classList.remove("hidden");
    return;
  }
  if (file && !/\.(pdf|doc|docx)$/i.test(file.name)) {
    error.textContent = "Choose a PDF or Word document (.pdf, .doc, or .docx).";
    error.classList.remove("hidden");
    return;
  }
  const button = $("#save-record");
  button.disabled = true;
  try {
    const editRecordId = $("#record-dialog").dataset.editRecordId;
    const previousRecord = editRecordId ? await readFromStore("records", editRecordId) : null;
    if (editRecordId && (!previousRecord || previousRecord.patientNumber !== profile.patientNumber)) {
      throw new Error("This record is no longer available in the current profile.");
    }
    const removeAttachment = $("#remove-attachment").checked;
    await saveToStore("records", {
      ...previousRecord,
      id: editRecordId || crypto.randomUUID(),
      patientNumber: profile.patientNumber,
      title,
      type: $("#record-type").value,
      recordDate: $("#record-date").value,
      providerName: $("#record-provider").value.trim(),
      notes: $("#record-notes").value.trim(),
      fileName: file?.name || (removeAttachment ? "" : previousRecord?.fileName || ""),
      file: file || (removeAttachment ? null : previousRecord?.file || null),
      createdAt: previousRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    $("#record-dialog").close();
    notify(editRecordId ? "Record updated." : "Record saved in this browser.");
    await openView(document.querySelector("[data-view='records'].active") ? "records" : "overview");
  } catch (saveError) {
    error.textContent = `Record could not be saved: ${saveError.message || "browser storage may be full"}`;
    error.classList.remove("hidden");
  } finally {
    button.disabled = false;
  }
});

async function openRecord(id) {
  const dialog = $("#detail-dialog");
  dialog.innerHTML = `<div class="empty-state"><h3>Opening record…</h3></div>`;
  dialog.showModal();
  try {
    const record = await readFromStore("records", id);
    if (!record || record.patientNumber !== profile.patientNumber) {
      throw new Error("This record could not be found in the current profile.");
    }
    dialog.innerHTML = `<form method="dialog" class="modal-dismiss"><button class="modal-close" aria-label="Close">×</button></form>
      <div class="modal-heading"><div class="modal-icon">${iconForType(record.type)}</div><div><h2>${escapeHtml(record.title)}</h2><p>${escapeHtml(record.type)} · ${escapeHtml(formatDate(record.recordDate))}</p></div></div>
      <div class="detail-info">${record.providerName ? `Provider / facility: ${escapeHtml(record.providerName)}\n` : ""}${record.createdAt ? `Added: ${escapeHtml(formatDate(record.createdAt.slice(0, 10)))}\n` : ""}${record.updatedAt ? `Last updated: ${escapeHtml(formatDate(record.updatedAt.slice(0, 10)))}\n` : ""}${record.notes ? `\n${escapeHtml(record.notes)}` : "No additional notes."}</div>
      ${record.fileName ? `<button class="primary-button" id="download-record">Download ${escapeHtml(record.fileName)}</button>` : `<p class="muted-copy">No file is attached to this record.</p>`}
      <div class="modal-actions"><button class="revoke-button" id="delete-record">Delete record</button><button class="secondary-button" id="edit-record">Edit details</button><button class="secondary-button" id="close-detail">Close</button></div>`;
    dialog.querySelector(".modal-dismiss").addEventListener("submit", (event) => {
      event.preventDefault();
      dialog.close();
    });
    dialog.querySelector("#close-detail").addEventListener("click", () => dialog.close());
    dialog.querySelector("#download-record")?.addEventListener("click", () => downloadFile(record));
    dialog.querySelector("#edit-record").addEventListener("click", () => {
      dialog.close();
      openRecordDialog(record);
    });
    dialog.querySelector("#delete-record").addEventListener("click", async () => {
      if (!window.confirm("Delete this record from this browser?")) return;
      try {
        const transaction = database.transaction("records", "readwrite");
        transaction.objectStore("records").delete(record.id);
        await completeTransaction(transaction);
        dialog.close();
        notify("Record deleted.");
        await openView(document.querySelector("[data-view='records'].active") ? "records" : "overview");
      } catch (error) {
        notify(error.message || "Could not delete record.");
      }
    });
  } catch (error) {
    dialog.innerHTML = `<form method="dialog" class="modal-dismiss"><button class="modal-close" aria-label="Close">×</button></form><div class="empty-state"><h3>Record unavailable</h3><p>${escapeHtml(error.message)}</p></div>`;
    dialog.querySelector(".modal-dismiss").addEventListener("submit", () => dialog.close());
  }
}

function downloadFile(record) {
  if (!(record.file instanceof Blob)) {
    notify("The attached file is not available in browser storage.");
    return;
  }
  const url = URL.createObjectURL(record.file);
  const link = document.createElement("a");
  link.href = url;
  link.download = record.fileName || "health-record";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function blobToBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const chunkSize = 0x8000;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function exportBackup() {
  try {
    const currentRecords = await readRecords();
    const backupRecords = [];
    for (const record of currentRecords) {
      const { file, ...details } = record;
      backupRecords.push({
        ...details,
        fileType: file instanceof Blob ? file.type : "",
        fileBase64: file instanceof Blob ? await blobToBase64(file) : "",
      });
    }
    const backup = {
      format: "wellnest-local-demo-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      records: backupRecords,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wellnest-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    notify(`Backup downloaded with ${currentRecords.length} record${currentRecords.length === 1 ? "" : "s"}. Keep the file somewhere safe.`);
  } catch (error) {
    notify(`Backup could not be exported: ${error.message || "browser storage error"}`);
  }
}

function validateBackup(backup) {
  if (!backup || backup.format !== "wellnest-local-demo-backup" || backup.version !== 1) {
    throw new Error("This file is not a supported Wellnest backup.");
  }
  const savedProfile = backup.profile;
  if (!savedProfile || typeof savedProfile.displayName !== "string" || savedProfile.displayName.trim().length < 2) {
    throw new Error("The backup does not contain a valid profile.");
  }
  if (!Array.isArray(backup.records) || backup.records.length > 1000) {
    throw new Error("The backup must contain fewer than 1,000 records.");
  }
  if (savedProfile.displayName.length > 100 || (savedProfile.phoneNumber && savedProfile.phoneNumber.length > 30)) {
    throw new Error("The profile details in this backup exceed the allowed length.");
  }
  let totalFileBytes = 0;
  const restoredRecords = backup.records.map((record) => {
    if (!record || typeof record.title !== "string" || !record.title.trim()
      || record.title.length > 120 || !RECORD_TYPES.includes(record.type)
      || typeof record.recordDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(record.recordDate)) {
      throw new Error("A record in this backup has invalid or incomplete details.");
    }
    if (typeof record.fileBase64 !== "string" || typeof record.fileName !== "string") {
      throw new Error("A file attachment in this backup is invalid.");
    }
    let file = null;
    if (record.fileBase64) {
      const fileBytes = Math.floor(record.fileBase64.length * 3 / 4);
      totalFileBytes += fileBytes;
      if (fileBytes > MAX_FILE_SIZE || totalFileBytes > 50 * 1024 * 1024
        || !/\.(pdf|doc|docx)$/i.test(record.fileName)) {
        throw new Error("A backup attachment is too large or is not a PDF/Word document.");
      }
      try {
        const binary = atob(record.fileBase64);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        file = new Blob([bytes], { type: record.fileType || "application/octet-stream" });
      } catch {
        throw new Error("A backup attachment could not be decoded.");
      }
    }
    return {
      id: crypto.randomUUID(),
      patientNumber: profile.patientNumber,
      title: record.title.trim(),
      type: record.type,
      recordDate: record.recordDate,
      providerName: typeof record.providerName === "string" ? record.providerName.slice(0, 120) : "",
      notes: typeof record.notes === "string" ? record.notes.slice(0, 2000) : "",
      fileName: file ? record.fileName : "",
      file,
      createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
    };
  });
  return {
    profile: {
      ...profile,
      displayName: savedProfile.displayName.trim(),
      phoneNumber: typeof savedProfile.phoneNumber === "string" ? savedProfile.phoneNumber.slice(0, 30) : "",
      dateOfBirth: typeof savedProfile.dateOfBirth === "string" ? savedProfile.dateOfBirth : "",
      healthProfile: savedProfile.healthProfile && typeof savedProfile.healthProfile === "object" ? savedProfile.healthProfile : {},
    },
    records: restoredRecords,
  };
}

async function importBackup(file) {
  if (!file) return;
  if (file.size > MAX_BACKUP_SIZE) {
    notify("Backup file exceeds 60 MB.");
    return;
  }
  if (!window.confirm("Restoring replaces this profile's current records and details. Export a backup first if you want to keep them. Continue?")) return;
  try {
    const restored = validateBackup(JSON.parse(await file.text()));
    const transaction = database.transaction(["profiles", "records"], "readwrite");
    const profiles = transaction.objectStore("profiles");
    const recordStore = transaction.objectStore("records");
    const cursorRequest = recordStore.index("patientNumber").openCursor(IDBKeyRange.only(profile.patientNumber));
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        restored.records.forEach((record) => recordStore.put(record));
        profiles.put(restored.profile);
      }
    };
    await completeTransaction(transaction);
    profile = restored.profile;
    records = await readRecords();
    $("#user-name").textContent = profile.displayName;
    $("#user-avatar").textContent = profile.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    notify(`Backup restored: ${records.length} record${records.length === 1 ? "" : "s"}.`);
    await openView("overview");
  } catch (error) {
    notify(`Backup could not be restored: ${error.message || "check the backup file and try again"}`);
  } finally {
    $("#backup-file").value = "";
  }
}

function openProfileDialog() {
  const health = profile.healthProfile || {};
  $("#profile-name").value = profile.displayName || "";
  $("#profile-phone").value = profile.phoneNumber || "";
  $("#profile-dob").value = profile.dateOfBirth || "";
  $("#profile-blood").value = health.bloodType || "";
  $("#profile-allergies").value = health.allergies || "";
  $("#profile-conditions").value = health.conditions || "";
  $("#profile-emergency-name").value = health.emergencyContactName || "";
  $("#profile-emergency-phone").value = health.emergencyContactPhone || "";
  $("#profile-error").classList.add("hidden");
  $("#profile-dialog").showModal();
}

document.querySelector("#profile-dialog .modal-dismiss").addEventListener("submit", (event) => {
  event.preventDefault();
  $("#profile-dialog").close();
});
$("#cancel-profile").addEventListener("click", () => $("#profile-dialog").close());
$("#profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#save-profile");
  const error = $("#profile-error");
  button.disabled = true;
  error.classList.add("hidden");
  try {
    const displayName = $("#profile-name").value.trim();
    if (displayName.length < 2) throw new Error("Enter your name.");
    profile = {
      ...profile,
      displayName,
      phoneNumber: $("#profile-phone").value.trim(),
      dateOfBirth: $("#profile-dob").value,
      healthProfile: {
        bloodType: $("#profile-blood").value,
        allergies: $("#profile-allergies").value.trim(),
        conditions: $("#profile-conditions").value.trim(),
        emergencyContactName: $("#profile-emergency-name").value.trim(),
        emergencyContactPhone: $("#profile-emergency-phone").value.trim(),
      },
    };
    await saveToStore("profiles", profile);
    $("#user-name").textContent = profile.displayName;
    $("#user-avatar").textContent = profile.displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    $("#profile-dialog").close();
    notify("Profile details saved.");
    await openView("overview");
  } catch (saveError) {
    error.textContent = saveError.message || "Could not save your profile.";
    error.classList.remove("hidden");
  } finally {
    button.disabled = false;
  }
});

async function initialize() {
  try {
    database = await openDatabase();
    const previousNumber = localStorage.getItem(ACTIVE_PROFILE_KEY);
    profile = previousNumber ? await readFromStore("profiles", previousNumber) : null;
    if (profile) await openDashboard();
    else showAuthScreen();
  } catch (error) {
    $("#auth-error").textContent = `Browser storage is unavailable: ${error.message || "enable site storage and reload."}`;
    $("#auth-error").classList.remove("hidden");
    $("#auth-submit").disabled = true;
  }
}

initialize();
