// ===============================
// INIT SUPABASE
// ===============================
const client = supabase.createClient(
    "https://gthgxmyccwsygbopksgz.supabase.co",
    "sb_publishable_rj-DwglUPiebIvlhWzoHhg_2632GYgW"
);

// ===============================
// DOM ELEMENTS
// ===============================
const loginScreen = document.getElementById("login-screen");
const dashboard = document.getElementById("dashboard");
const bootScreen = document.getElementById("boot-screen");
const bootText = document.getElementById("boot-text");

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

const uploadBtn = document.getElementById("upload-btn");
const uploadStatus = document.getElementById("upload-status");

const schemInput = document.getElementById("schematic-input");
const imgInput = document.getElementById("image-input");

// ===============================
// INITIAL STATE
// ===============================
loginScreen.style.display = "none";
dashboard.style.display = "none";

// ===============================
// BOOT SEQUENCE
// ===============================
const bootLines = [
    "Initializing GoatedMC Admin Terminal...",
    "Loading modules...",
    "Wait… who let the chickens in here?",
    "Cluckin the Trucks..",
    "Ready."
];

let bootIndex = 0;

function runBoot() {
    if (bootIndex < bootLines.length) {
        bootText.innerText += bootLines[bootIndex] + "\n";
        bootIndex++;
        setTimeout(runBoot, 600);
    } else {
        setTimeout(() => {
            bootScreen.style.display = "none";
            loginScreen.style.display = "block";
        }, 800);
    }
}

runBoot();

// ===============================
// LOGIN
// ===============================
loginBtn.onclick = async () => {
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value.trim();
    const errorBox = document.getElementById("login-error");

    if (!email || !pass) {
        errorBox.innerText = "Missing credentials.";
        return;
    }

    const { error } = await client.auth.signInWithPassword({ email, password: pass });

    if (error) {
        errorBox.innerText = "Access Denied.";
    } else {
        loginScreen.style.display = "none";
        dashboard.style.display = "flex";
    }
};

// ===============================
// NAVIGATION
// ===============================
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        document.getElementById("page-" + btn.dataset.page).classList.add("active");
    };
});

// ===============================
// DRAG & DROP HELPERS
// ===============================
function setupDropZone(zoneId, inputId) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);

    zone.onclick = () => input.click();

    zone.ondragover = e => {
        e.preventDefault();
        zone.classList.add("hover");
    };

    zone.ondragleave = () => zone.classList.remove("hover");

    zone.ondrop = e => {
        e.preventDefault();
        zone.classList.remove("hover");
        input.files = e.dataTransfer.files;
    };
}

setupDropZone("schematic-drop", "schematic-input");
setupDropZone("image-drop", "image-input");

// ===============================
// UPLOAD
// ===============================
uploadBtn.onclick = async () => {
    uploadStatus.innerText = "Uploading...";

    const schemFile = schemInput.files[0];
    const imgFile = imgInput.files[0];

    if (!schemFile || !imgFile) {
        uploadStatus.innerText = "Missing files.";
        return;
    }

    const name = document.getElementById("schem-name").value.trim();
    const desc = document.getElementById("schem-desc").value.trim();
    const tags = document.getElementById("schem-tags").value.split(",").map(t => t.trim()).filter(Boolean);

    try {
        // Upload schematic
        await client.storage.from("schematics").upload(`schems/${schemFile.name}`, schemFile);

        // Upload image
        await client.storage.from("schematics").upload(`images/${imgFile.name}`, imgFile);

        // Insert DB entry
        await client.from("schematics").insert({
            name,
            description: desc,
            tags,
            file: schemFile.name,
            image: imgFile.name
        });

        uploadStatus.innerText = "Upload complete!";
    } catch (err) {
        uploadStatus.innerText = "Upload failed.";
        console.error(err);
    }
};

// ===============================
// LOGOUT
// ===============================
logoutBtn.onclick = async () => {
    await client.auth.signOut();
    location.reload();
};
