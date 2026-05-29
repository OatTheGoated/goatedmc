// INIT SUPABASE
const client = supabase.createClient(
    "https://gthgxmyccwsygbopksgz.supabase.co",
    "sb_publishable_rj-DwglUPiebIvlhWzoHhg_2632GYgW"
);

// BOOT SEQUENCE
const bootLines = [
    "Initializing GoatedMC Admin Terminal...",
    "Loading modules...",
    "Wait… who let the chickens in here?",
    "Cluckin the Trucks..",
    "Ready."
];

let bootIndex = 0;
const bootText = document.getElementById("boot-text");

function runBoot() {
    if (bootIndex < bootLines.length) {
        bootText.innerText += bootLines[bootIndex] + "\n";
        bootIndex++;
        setTimeout(runBoot, 600);
    } else {
        setTimeout(() => {
            document.getElementById("boot-screen").classList.add("hidden");
            document.getElementById("login-screen").classList.remove("hidden");
        }, 800);
    }
}

runBoot();

// LOGIN
document.getElementById("login-btn").onclick = async () => {
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-password").value;

    const { error } = await client.auth.signInWithPassword({
        email: email,
        password: pass
    });

    if (error) {
        document.getElementById("login-error").innerText = "Access Denied.";
    } else {
        document.getElementById("login-screen").classList.add("hidden");
        document.getElementById("dashboard").classList.remove("hidden");
    }
};

// NAVIGATION
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
        document.getElementById("page-" + btn.dataset.page).classList.add("active");
    };
});

// DRAG & DROP HELPERS
function setupDropZone(zoneId, inputId) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);

    zone.onclick = () => input.click();
    zone.ondragover = e => { e.preventDefault(); zone.classList.add("hover"); };
    zone.ondragleave = () => zone.classList.remove("hover");
    zone.ondrop = e => {
        e.preventDefault();
        zone.classList.remove("hover");
        input.files = e.dataTransfer.files;
    };
}

setupDropZone("schematic-drop", "schematic-input");
setupDropZone("image-drop", "image-input");

// UPLOAD
document.getElementById("upload-btn").onclick = async () => {
    const status = document.getElementById("upload-status");
    status.innerText = "Uploading...";

    const schemFile = document.getElementById("schematic-input").files[0];
    const imgFile = document.getElementById("image-input").files[0];

    if (!schemFile || !imgFile) {
        status.innerText = "Missing files.";
        return;
    }

    const name = document.getElementById("schem-name").value;
    const desc = document.getElementById("schem-desc").value;
    const tags = document.getElementById("schem-tags").value.split(",");

    // Upload schematic
    await client.storage.from("schematics").upload(`schems/${schemFile.name}`, schemFile);

    // Upload image
    await client.storage.from("schematics").upload(`images/${imgFile.name}`, imgFile);

    // Insert DB entry
    await client.from("schematics").insert({
        name: name,
        description: desc,
        tags: tags,
        file: schemFile.name,
        image: imgFile.name
    });

    status.innerText = "Upload complete!";
};

// LOGOUT
document.getElementById("logout-btn").onclick = async () => {
    await client.auth.signOut();
    location.reload();
};

