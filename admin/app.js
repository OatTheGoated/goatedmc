// admin/app.js

// ====== CONFIG ======
const SCHEMATICS_JSON_ELEMENT_ID = "schematicsJsonOutput"; // <textarea> or <pre>
const SCHEMATIC_LIST_ELEMENT_ID = "schematicsList";        // <div> or <ul>
const FORM_ID = "schematicForm";                           // <form>

// If you already have existing schematics loaded from schematics.json,
// you can assign them here or fetch them.
let schematics = [];

// ====== HELPERS ======

function $(id) {
    return document.getElementById(id);
}

function showError(message) {
    alert(message);
}

function createSchematicFromForm(form) {
    const name = form.name.value.trim();
    const description = form.description.value.trim();
    const version = form.version.value.trim();
    const mcVersion = form.mcVersion.value.trim();
    const downloadUrl = form.downloadUrl.value.trim();
    const imageUrl = form.imageUrl.value.trim();
    const tagsRaw = form.tags.value.trim();
    const featured = form.featured.checked;

    // Basic validation
    if (!name || !description || !version || !mcVersion || !downloadUrl) {
        showError("Please fill in all required fields (name, description, version, MC version, download URL).");
        return null;
    }

    const tags = tagsRaw
        ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean)
        : [];

    return {
        name,
        description,
        version,
        mcVersion,
        downloadUrl,
        imageUrl,
        tags,
        featured
    };
}

function renderSchematicsList() {
    const container = $(SCHEMATIC_LIST_ELEMENT_ID);
    if (!container) return;

    container.innerHTML = "";

    if (!schematics.length) {
        container.innerHTML = "<p>No schematics added yet.</p>";
        return;
    }

    schematics.forEach((s, index) => {
        const item = document.createElement("div");
        item.className = "schematic-item";

        item.innerHTML = `
            <h3>${escapeHtml(s.name)}</h3>
            <p><strong>Description:</strong> ${escapeHtml(s.description)}</p>
            <p><strong>Version:</strong> ${escapeHtml(s.version)}</p>
            <p><strong>MC Version:</strong> ${escapeHtml(s.mcVersion)}</p>
            <p><strong>Download:</strong> <a href="${s.downloadUrl}" target="_blank">Link</a></p>
            ${s.imageUrl ? `<p><strong>Image:</strong> <a href="${s.imageUrl}" target="_blank">Preview</a></p>` : ""}
            ${s.tags && s.tags.length ? `<p><strong>Tags:</strong> ${s.tags.map(escapeHtml).join(", ")}</p>` : ""}
            <p><strong>Featured:</strong> ${s.featured ? "Yes" : "No"}</p>
            <button type="button" data-index="${index}" class="delete-schematic-btn">Delete</button>
        `;

        container.appendChild(item);
    });

    attachDeleteHandlers();
}

function attachDeleteHandlers() {
    const buttons = document.querySelectorAll(".delete-schematic-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const index = parseInt(btn.getAttribute("data-index"), 10);
            if (!isNaN(index)) {
                schematics.splice(index, 1);
                updateJsonOutput();
                renderSchematicsList();
            }
        });
    });
}

function updateJsonOutput() {
    const output = $(SCHEMATICS_JSON_ELEMENT_ID);
    if (!output) return;

    const json = JSON.stringify(schematics, null, 2);
    output.value !== undefined ? (output.value = json) : (output.textContent = json);
}

// Simple HTML escape to avoid weird rendering in admin
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ====== FORM HANDLING ======

function handleFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const schematic = createSchematicFromForm(form);

    if (!schematic) return;

    schematics.push(schematic);
    updateJsonOutput();
    renderSchematicsList();
    form.reset();
}

// ====== INIT ======

function initAdmin() {
    const form = $(FORM_ID);
    if (!form) {
        console.error(`Form with id="${FORM_ID}" not found.`);
        return;
    }

    form.addEventListener("submit", handleFormSubmit);

    // If you want to preload existing schematics from a JSON file:
    // preloadSchematics();
}

// Example preload (optional)
// function preloadSchematics() {
//     fetch("/data/schematics.json")
//         .then(res => res.json())
//         .then(data => {
//             schematics = Array.isArray(data) ? data : [];
//             updateJsonOutput();
//             renderSchematicsList();
//         })
//         .catch(err => console.error("Failed to load schematics.json", err));
// }

document.addEventListener("DOMContentLoaded", initAdmin);

