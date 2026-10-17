const patients = [
  {
    id: "pt-1042", name: "Eleanor Brooks", initials: "EB", mrn: "NL-004281",
    age: 67, sex: "Female", dob: "1959-02-14", room: "Exam 04", department: "Internal Medicine",
    reason: "Blood pressure follow-up", arrival: "08:12", clinician: "Dr. Alex Parker", status: "Ready",
    priority: "Routine", allergies: "Penicillin", encounterStatus: "In progress",
    note: "Follow-up visit. Review home readings and medication tolerance.",
    vitals: { bloodPressure: "138/82", pulse: "76", temperature: "36.8", respiratoryRate: "16", oxygen: "98", weight: "71.4" },
    medications: [{ name: "Lisinopril", detail: "10 mg tablet", schedule: "Once daily" }, { name: "Vitamin D3", detail: "1000 IU capsule", schedule: "Once daily" }],
    history: [{ title: "Primary care follow-up", date: "Oct 17, 2026", detail: "Internal Medicine · Dr. Parker" }, { title: "Comprehensive metabolic panel", date: "Sep 29, 2026", detail: "Laboratory · Result filed" }],
  },
  {
    id: "pt-1087", name: "Marcus Reed", initials: "MR", mrn: "NL-004326",
    age: 42, sex: "Male", dob: "1984-07-09", room: "Waiting room", department: "Family Medicine",
    reason: "New patient consultation", arrival: "08:24", clinician: "Dr. Mina Shah", status: "Waiting",
    priority: "Routine", allergies: "No known allergies recorded", encounterStatus: "Not started",
    note: "", vitals: { bloodPressure: "124/78", pulse: "72", temperature: "36.7", respiratoryRate: "14", oxygen: "99", weight: "83.2" },
    medications: [{ name: "No active medications", detail: "Medication list reviewed", schedule: "" }],
    history: [{ title: "New patient intake", date: "Oct 17, 2026", detail: "Family Medicine · Intake pending" }],
  },
  {
    id: "pt-1116", name: "Sofia Alvarez", initials: "SA", mrn: "NL-004355",
    age: 31, sex: "Female", dob: "1995-05-22", room: "Exam 02", department: "Orthopedics",
    reason: "Post-visit review", arrival: "08:31", clinician: "Dr. Leo Morgan", status: "In progress",
    priority: "Routine", allergies: "Latex", encounterStatus: "In progress",
    note: "Review interval symptoms and confirm follow-up plan.",
    vitals: { bloodPressure: "116/74", pulse: "80", temperature: "36.6", respiratoryRate: "15", oxygen: "99", weight: "62.8" },
    medications: [{ name: "Ibuprofen", detail: "200 mg tablet", schedule: "As needed per label" }],
    history: [{ title: "Orthopedics follow-up", date: "Oct 17, 2026", detail: "Orthopedics · Dr. Morgan" }, { title: "Initial consultation", date: "Oct 03, 2026", detail: "Orthopedics · Visit completed" }],
  },
  {
    id: "pt-1153", name: "Daniel Kim", initials: "DK", mrn: "NL-004392",
    age: 55, sex: "Male", dob: "1971-11-03", room: "Exam 07", department: "Cardiology",
    reason: "Diagnostic results review", arrival: "08:46", clinician: "Dr. Nia Okafor", status: "Ready",
    priority: "Time-sensitive", allergies: "No known allergies recorded", encounterStatus: "Not started",
    note: "", vitals: { bloodPressure: "132/80", pulse: "68", temperature: "36.5", respiratoryRate: "16", oxygen: "98", weight: "89.1" },
    medications: [{ name: "Atorvastatin", detail: "20 mg tablet", schedule: "Once daily" }],
    history: [{ title: "Diagnostic results review", date: "Oct 17, 2026", detail: "Cardiology · Results available" }, { title: "ECG", date: "Oct 10, 2026", detail: "Cardiology · Filed" }],
  },
  {
    id: "pt-1198", name: "Priya Nair", initials: "PN", mrn: "NL-004437",
    age: 28, sex: "Female", dob: "1998-01-18", room: "Waiting room", department: "Family Medicine",
    reason: "Preventive visit", arrival: "09:03", clinician: "Dr. Mina Shah", status: "Waiting",
    priority: "Routine", allergies: "No known allergies recorded", encounterStatus: "Not started",
    note: "", vitals: { bloodPressure: "110/70", pulse: "74", temperature: "36.6", respiratoryRate: "14", oxygen: "99", weight: "58.7" },
    medications: [{ name: "No active medications", detail: "Medication list reviewed", schedule: "" }],
    history: [{ title: "Preventive visit", date: "Oct 17, 2026", detail: "Family Medicine · Intake pending" }],
  },
  {
    id: "pt-1214", name: "George Wallace", initials: "GW", mrn: "NL-004453",
    age: 73, sex: "Male", dob: "1953-09-16", room: "Exam 01", department: "Internal Medicine",
    reason: "Medication review", arrival: "09:11", clinician: "Dr. Alex Parker", status: "Ready",
    priority: "Routine", allergies: "Sulfa medications", encounterStatus: "Not started",
    note: "", vitals: { bloodPressure: "128/76", pulse: "70", temperature: "36.5", respiratoryRate: "16", oxygen: "97", weight: "78.5" },
    medications: [{ name: "Metformin", detail: "500 mg tablet", schedule: "Twice daily" }, { name: "Amlodipine", detail: "5 mg tablet", schedule: "Once daily" }],
    history: [{ title: "Medication review", date: "Oct 17, 2026", detail: "Internal Medicine · Dr. Parker" }, { title: "Primary care visit", date: "Jul 18, 2026", detail: "Internal Medicine · Visit completed" }],
  },
];

const orders = [
  { id: "ord-201", patientId: "pt-1153", type: "ECG", detail: "12-lead tracing", placed: "08:34", department: "Cardiology", status: "In progress" },
  { id: "ord-204", patientId: "pt-1042", type: "Laboratory", detail: "Basic metabolic panel", placed: "08:40", department: "Laboratory", status: "Queued" },
  { id: "ord-209", patientId: "pt-1116", type: "Imaging", detail: "Radiology follow-up", placed: "08:51", department: "Imaging", status: "Queued" },
];

const tasks = [
  { id: "task-1", title: "Review results inbox", detail: "2 items · Cardiology", done: false },
  { id: "task-2", title: "Confirm afternoon coverage", detail: "Care team · 13:00", done: false },
  { id: "task-3", title: "Close yesterday's notes", detail: "3 encounters", done: true },
];

const state = { view: "overview", patientId: null, chartTab: "overview", patientFilter: "", statusFilter: "" };
const main = document.querySelector("#main-content");
const noteDialog = document.querySelector("#note-dialog");
let toastTimer;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function getPatient(id) {
  return patients.find((patient) => patient.id === id);
}

function setView(view) {
  state.view = view;
  state.patientId = null;
  state.patientFilter = "";
  state.statusFilter = "";
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  document.querySelector("#page-context").textContent = ({ overview: "Overview", patients: "Patients", schedule: "Schedule", orders: "Orders" })[view];
  render();
  main.focus({ preventScroll: true });
}

function openPatient(id) {
  state.patientId = id;
  state.chartTab = "overview";
  document.querySelector("#search-results").classList.add("hidden");
  document.querySelector("#global-search").value = "";
  document.querySelector("#global-search").setAttribute("aria-expanded", "false");
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === "patients"));
  document.querySelector("#page-context").textContent = "Patient chart";
  render();
  main.focus({ preventScroll: true });
}

function initialsClass(index) {
  return ["", "alt", "blue"][index % 3];
}

function patientCell(patient, index) {
  return `<span class="patient-cell"><span class="patient-initials ${initialsClass(index)}">${escapeHtml(patient.initials)}</span><span><strong>${escapeHtml(patient.name)}</strong><small>${escapeHtml(patient.mrn)}</small></span></span>`;
}

function statusClass(status) {
  return ({ Waiting: "waiting", Ready: "ready", "In progress": "progress", Completed: "complete" })[status] || "";
}

function patientRows(list = patients) {
  if (!list.length) return `<tr><td colspan="6"><div class="empty-state">No patients match those filters.</div></td></tr>`;
  return list.map((patient) => {
    const index = patients.indexOf(patient);
    return `<tr data-patient-id="${escapeHtml(patient.id)}" tabindex="0"><td>${patientCell(patient, index)}</td><td>${escapeHtml(patient.reason)}</td><td>${escapeHtml(patient.arrival)}</td><td>${escapeHtml(patient.clinician)}</td><td><span class="status ${statusClass(patient.status)}">${escapeHtml(patient.status)}</span></td><td>${patient.priority === "Time-sensitive" ? `<span class="priority"><i></i>${escapeHtml(patient.priority)}</span>` : `<span class="muted-cell">${escapeHtml(patient.priority)}</span>`}</td></tr>`;
  }).join("");
}

function queueTable(list = patients, compact = false) {
  return `<div class="table-scroll"><table class="data-table"><thead><tr><th>Patient</th><th>Visit reason</th><th>Arrived</th><th>Care team</th><th>Status</th><th>Priority</th></tr></thead><tbody>${patientRows(compact ? list.slice(0, 5) : list)}</tbody></table></div>`;
}

function renderOverview() {
  const now = new Date();
  const today = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(now);
  const waiting = patients.filter((patient) => patient.status === "Waiting").length;
  const active = patients.filter((patient) => patient.status === "In progress").length;
  return `<section class="page-heading"><div><p class="eyebrow">CLINICAL WORKSPACE / CENTRAL CAMPUS</p><h1>Good morning, Dr. Parker</h1><p>Here is the care team overview for today.</p></div><div class="heading-actions"><span class="today-label">${escapeHtml(today)}</span></div></section>
    <section class="metric-grid" aria-label="Today's activity">
      <article class="metric"><div class="metric-top"><span>Arrivals today</span><i class="metric-icon">↗</i></div><div class="metric-bottom"><strong class="metric-value">18</strong><span class="metric-foot">6 checked in</span></div></article>
      <article class="metric"><div class="metric-top"><span>Waiting for room</span><i class="metric-icon amber">◷</i></div><div class="metric-bottom"><strong class="metric-value">${String(waiting).padStart(2, "0")}</strong><span class="metric-foot">Across 3 departments</span></div></article>
      <article class="metric"><div class="metric-top"><span>Active encounters</span><i class="metric-icon blue">▤</i></div><div class="metric-bottom"><strong class="metric-value">${String(active).padStart(2, "0")}</strong><span class="metric-foot">In progress</span></div></article>
      <article class="metric"><div class="metric-top"><span>Open orders</span><i class="metric-icon rose">⌁</i></div><div class="metric-bottom"><strong class="metric-value">${String(orders.filter((order) => order.status !== "Complete").length).padStart(2, "0")}</strong><span class="metric-foot">Across the care team</span></div></article>
    </section>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-header"><div><h2>Patient queue</h2><p>Patients checked in for today's visits</p></div><button class="text-action" data-navigate="patients">Open patient list →</button></div>${queueTable(patients, true)}</section>
      <div class="side-stack">
        <section class="panel"><div class="panel-header"><div><h2>My tasks</h2><p>Care team follow-up</p></div><span class="task-count">${tasks.filter((task) => !task.done).length} OPEN</span></div><div class="task-list">${tasks.map((task) => `<label class="task-row ${task.done ? "done" : ""}"><input type="checkbox" data-task-id="${task.id}" ${task.done ? "checked" : ""} /><span><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.detail)}</small></span></label>`).join("")}</div></section>
        <section class="panel"><div class="panel-header"><div><h2>Care coordination</h2><p>Items needing team attention</p></div></div><div class="notice-list"><div class="notice-item"><span class="notice-symbol">⌁</span><span><strong>3 diagnostic orders in progress</strong><small>Check the orders workspace for status.</small></span></div><div class="notice-item"><span class="notice-symbol">◷</span><span><strong>2 patients are waiting</strong><small>Review the queue and room availability.</small></span></div></div></section>
      </div>
    </div>`;
}

function renderPatients() {
  const filtered = patients.filter((patient) => {
    const query = state.patientFilter.toLowerCase();
    return (!query || `${patient.name} ${patient.mrn} ${patient.reason} ${patient.clinician}`.toLowerCase().includes(query))
      && (!state.statusFilter || patient.status === state.statusFilter);
  });
  return `<section class="page-heading"><div><p class="eyebrow">PATIENT DIRECTORY / TRAINING DATA</p><h1>Patients</h1><p>Find a patient and open their chart.</p></div><div class="heading-actions"><span class="today-label">${patients.length} demo records</span></div></section>
    <section class="panel"><div class="filter-bar"><input class="filter-input" id="patient-filter" type="search" placeholder="Search name, MRN, or visit reason" aria-label="Search patients" value="${escapeHtml(state.patientFilter)}" /><select class="filter-select" id="status-filter" aria-label="Filter by encounter status"><option value="">All statuses</option>${["Waiting", "Ready", "In progress", "Completed"].map((status) => `<option ${state.statusFilter === status ? "selected" : ""}>${status}</option>`).join("")}</select><span class="result-count">${filtered.length} RESULTS</span></div>${queueTable(filtered)}</section>`;
}

function renderSchedule() {
  const sorted = [...patients].sort((a, b) => a.arrival.localeCompare(b.arrival));
  return `<section class="page-heading"><div><p class="eyebrow">CENTRAL CAMPUS / DAILY VIEW</p><h1>Schedule</h1><p>Today's appointments and check-in status.</p></div><div class="heading-actions"><span class="today-label">${escapeHtml(new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date()))}</span></div></section>
    <section class="panel"><div class="panel-header"><div><h2>Appointments</h2><p>Scheduled patients across departments</p></div><span class="task-count">${sorted.length} VISITS</span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Time</th><th>Patient</th><th>Department</th><th>Visit reason</th><th>Clinician</th><th>Check-in</th></tr></thead><tbody>${sorted.map((patient, index) => `<tr data-patient-id="${patient.id}" tabindex="0"><td><strong>${patient.arrival}</strong></td><td>${patientCell(patient, index)}</td><td>${escapeHtml(patient.department)}</td><td>${escapeHtml(patient.reason)}</td><td>${escapeHtml(patient.clinician)}</td><td><span class="status ${statusClass(patient.status)}">${escapeHtml(patient.status)}</span></td></tr>`).join("")}</tbody></table></div></section>`;
}

function renderOrders() {
  return `<section class="page-heading"><div><p class="eyebrow">CARE COORDINATION / DIAGNOSTICS</p><h1>Orders</h1><p>Track diagnostic requests in this training simulation.</p></div><div class="heading-actions"><span class="today-label">${orders.filter((order) => order.status !== "Complete").length} open</span></div></section>
    <section class="panel"><div class="panel-header"><div><h2>Diagnostic orders</h2><p>Demo orders are not sent to a laboratory or imaging system.</p></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Patient</th><th>Order</th><th>Department</th><th>Placed</th><th>Status</th><th>Action</th></tr></thead><tbody>${orders.map((order) => { const patient = getPatient(order.patientId); return `<tr><td>${patientCell(patient, patients.indexOf(patient))}</td><td><strong>${escapeHtml(order.type)}</strong><br /><span class="muted-cell">${escapeHtml(order.detail)}</span></td><td>${escapeHtml(order.department)}</td><td>${escapeHtml(order.placed)}</td><td><span class="status ${order.status === "Complete" ? "complete" : "waiting"}">${escapeHtml(order.status)}</span></td><td>${order.status === "Complete" ? "—" : `<button class="button compact" data-complete-order="${order.id}">Mark complete</button>`}</td></tr>`; }).join("")}</tbody></table></div></section>`;
}

function renderVitals(patient) {
  const values = [
    ["Blood pressure", patient.vitals.bloodPressure, "mmHg"], ["Pulse", patient.vitals.pulse, "bpm"],
    ["Temperature", patient.vitals.temperature, "°C"], ["Respiratory rate", patient.vitals.respiratoryRate, "/min"],
    ["Oxygen saturation", patient.vitals.oxygen, "%"], ["Weight", patient.vitals.weight, "kg"],
  ];
  return `<div class="vitals-grid">${values.map(([label, value, unit]) => `<div class="vital"><span>${label}</span><strong>${escapeHtml(value)}</strong><small>${unit}</small></div>`).join("")}</div>`;
}

function renderMedications(patient) {
  return `<div class="chart-section"><div class="section-heading"><h2>Medication list</h2><span>${patient.medications.length} ENTRIES</span></div>${patient.medications.map((medication) => `<div class="med-row"><span><strong>${escapeHtml(medication.name)}</strong><small>${escapeHtml(medication.detail)}</small></span><span>${escapeHtml(medication.schedule)}</span></div>`).join("")}<p class="field-hint">Medication details are synthetic and for interface demonstration only.</p></div>`;
}

function renderHistory(patient) {
  return `<div class="chart-section"><div class="section-heading"><h2>Encounter history</h2><span>${patient.history.length} EVENTS</span></div><div class="timeline">${patient.history.map((entry) => `<div class="timeline-item"><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.date)} · ${escapeHtml(entry.detail)}</small></div>`).join("")}</div></div>`;
}

function renderChart(patient) {
  const tabContent = state.chartTab === "medications"
    ? renderMedications(patient)
    : state.chartTab === "visits"
      ? renderHistory(patient)
      : `<div class="chart-section"><div class="section-heading"><h2>Active encounter</h2><span>${escapeHtml(patient.encounterStatus.toUpperCase())}</span></div>${patient.note ? `<article class="encounter-card"><div class="encounter-top"><span><strong>${escapeHtml(patient.reason)}</strong><small>${escapeHtml(patient.arrival)} · ${escapeHtml(patient.department)}</small></span><span class="status ${statusClass(patient.status)}">${escapeHtml(patient.encounterStatus)}</span></div><p>${escapeHtml(patient.note)}</p></article>` : `<p class="encounter-empty">No note has been entered for this demo encounter.</p>`}</div><div class="chart-section"><div class="section-heading"><h2>Latest vitals</h2><span>RECORDED ${escapeHtml(patient.arrival)}</span></div>${renderVitals(patient)}</div>`;
  return `<section class="chart-banner"><span class="patient-initials">${escapeHtml(patient.initials)}</span><div class="chart-identity"><p class="eyebrow">PATIENT CHART / ${escapeHtml(patient.department.toUpperCase())}</p><h1>${escapeHtml(patient.name)}</h1><p>${escapeHtml(patient.age)} years · ${escapeHtml(patient.sex)} · ${escapeHtml(patient.reason)}</p></div><div class="chart-actions"><button class="button" data-chart-tab="medications">Medication list</button><button class="button primary" data-add-note="${patient.id}">＋ Add note</button></div></section>
    <div class="chart-metadata"><span>Medical record number<strong>${escapeHtml(patient.mrn)}</strong></span><span>Date of birth<strong>${escapeHtml(new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${patient.dob}T00:00:00`)))}</strong></span><span>Location<strong>${escapeHtml(patient.room)}</strong></span><span>Care team<strong>${escapeHtml(patient.clinician)}</strong></span></div>
    <div class="allergy-banner"><b>!</b><strong>Allergies</strong><span>${escapeHtml(patient.allergies)}</span></div>
    <nav class="tabs" aria-label="Patient chart sections"><button class="tab ${state.chartTab === "overview" ? "active" : ""}" data-chart-tab="overview">Overview</button><button class="tab ${state.chartTab === "visits" ? "active" : ""}" data-chart-tab="visits">Visits</button><button class="tab ${state.chartTab === "medications" ? "active" : ""}" data-chart-tab="medications">Medications</button></nav>
    <div class="chart-grid"><section class="panel">${tabContent}</section><div class="side-stack"><section class="panel"><div class="panel-header"><div><h2>Visit details</h2><p>Current encounter</p></div><span class="status ${statusClass(patient.status)}">${escapeHtml(patient.status)}</span></div><div class="chart-section"><div class="med-row"><span><strong>Visit reason</strong><small>${escapeHtml(patient.reason)}</small></span></div><div class="med-row"><span><strong>Check-in</strong><small>${escapeHtml(patient.arrival)} · ${escapeHtml(patient.room)}</small></span></div><div class="med-row"><span><strong>Department</strong><small>${escapeHtml(patient.department)}</small></span></div>${patient.status !== "Completed" ? `<button class="button primary" data-complete-encounter="${patient.id}" style="width:100%;margin-top:10px">Complete encounter</button>` : `<p class="field-hint">Encounter marked complete in this session.</p>`}</div></section><section class="panel"><div class="panel-header"><div><h2>Recent history</h2><p>Latest recorded events</p></div><button class="text-action" data-chart-tab="visits">View visits →</button></div><div class="chart-section"><div class="timeline">${patient.history.slice(0, 2).map((entry) => `<div class="timeline-item"><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.date)} · ${escapeHtml(entry.detail)}</small></div>`).join("")}</div></div></section></div></div>`;
}

function render() {
  if (state.patientId) {
    const patient = getPatient(state.patientId);
    main.innerHTML = patient ? renderChart(patient) : `<div class="empty-state">Patient not found.</div>`;
    return;
  }
  main.innerHTML = ({ overview: renderOverview, patients: renderPatients, schedule: renderSchedule, orders: renderOrders })[state.view]();
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function renderSearchResults(query) {
  const results = document.querySelector("#search-results");
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    results.classList.add("hidden");
    document.querySelector("#global-search").setAttribute("aria-expanded", "false");
    return [];
  }
  const matches = patients.filter((patient) => `${patient.name} ${patient.mrn}`.toLowerCase().includes(normalized)).slice(0, 5);
  results.innerHTML = matches.length ? matches.map((patient) => `<button class="search-result" role="option" data-open-patient="${patient.id}">${patientCell(patient, patients.indexOf(patient))}<span class="status ${statusClass(patient.status)}">${escapeHtml(patient.status)}</span></button>`).join("") : `<div class="empty-state">No synthetic patient matches.</div>`;
  results.classList.remove("hidden");
  document.querySelector("#global-search").setAttribute("aria-expanded", "true");
  return matches;
}

document.querySelectorAll(".nav-link").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
document.querySelector("#global-search").addEventListener("input", (event) => renderSearchResults(event.target.value));
document.querySelector("#global-search").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.currentTarget.value = "";
    renderSearchResults("");
  }
  if (event.key === "Enter") {
    const match = patients.find((patient) => `${patient.name} ${patient.mrn}`.toLowerCase().includes(event.currentTarget.value.trim().toLowerCase()));
    if (match) openPatient(match.id);
  }
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector("#global-search").focus();
  }
});
document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-navigate]");
  if (nav) setView(nav.dataset.navigate);
  const patientRow = event.target.closest("[data-patient-id]");
  if (patientRow) openPatient(patientRow.dataset.patientId);
  const openResult = event.target.closest("[data-open-patient]");
  if (openResult) openPatient(openResult.dataset.openPatient);
  const tab = event.target.closest("[data-chart-tab]");
  if (tab) {
    state.chartTab = tab.dataset.chartTab;
    render();
  }
  const noteButton = event.target.closest("[data-add-note]");
  if (noteButton) {
    const patient = getPatient(noteButton.dataset.addNote);
    document.querySelector("#note-title").textContent = `Add note · ${patient.name}`;
    document.querySelector("#note-patient").textContent = `${patient.mrn} · ${patient.reason} · Synthetic training record`;
    document.querySelector("#note-text").value = patient.note;
    noteDialog.showModal();
    document.querySelector("#note-text").focus();
  }
  const completeEncounter = event.target.closest("[data-complete-encounter]");
  if (completeEncounter) {
    const patient = getPatient(completeEncounter.dataset.completeEncounter);
    patient.status = "Completed";
    patient.encounterStatus = "Completed";
    render();
    showToast("Demo encounter marked complete for this session.");
  }
  const completeOrder = event.target.closest("[data-complete-order]");
  if (completeOrder) {
    const order = orders.find((item) => item.id === completeOrder.dataset.completeOrder);
    order.status = "Complete";
    render();
    showToast("Demo order updated for this session.");
  }
  if (!event.target.closest(".global-search-wrap")) {
    document.querySelector("#search-results").classList.add("hidden");
    document.querySelector("#global-search").setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (event) => {
  const row = event.target.closest("tr[data-patient-id]");
  if (row && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    openPatient(row.dataset.patientId);
  }
});
main.addEventListener("input", (event) => {
  if (event.target.id === "patient-filter") {
    state.patientFilter = event.target.value;
    render();
    const input = document.querySelector("#patient-filter");
    input.focus();
    input.setSelectionRange(state.patientFilter.length, state.patientFilter.length);
  }
});
main.addEventListener("change", (event) => {
  if (event.target.id === "status-filter") {
    state.statusFilter = event.target.value;
    render();
  }
  if (event.target.matches("[data-task-id]")) {
    const task = tasks.find((item) => item.id === event.target.dataset.taskId);
    task.done = event.target.checked;
    render();
  }
});
document.querySelector("#note-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.patientId) return;
  const patient = getPatient(state.patientId);
  patient.note = document.querySelector("#note-text").value.trim();
  patient.encounterStatus = "In progress";
  patient.status = patient.status === "Waiting" ? "In progress" : patient.status;
  noteDialog.close();
  render();
  showToast("Demo note saved in page memory only.");
});
document.querySelector("#cancel-note").addEventListener("click", () => noteDialog.close());
document.querySelector(".close-dialog").addEventListener("click", () => noteDialog.close());
noteDialog.addEventListener("click", (event) => {
  if (event.target === noteDialog) noteDialog.close();
});

const manifestLink = document.querySelector('link[rel="manifest"]');
if (manifestLink && "serviceWorker" in navigator) {
  const appRoot = new URL("./", manifestLink.href);
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("service-worker.js", appRoot)).catch(() => {});
  });
}

render();