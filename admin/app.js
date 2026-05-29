// ===============================
// ADMIN NAMESPACE CHECK
// ===============================
if (document.body.classList.contains("admin")) {

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
    // LOAD SCHEMATICS LIST
    // ===============================
    async function loadSchematics() {
        const list = document.getElementById("schem-list");
        list.innerHTML = "<p>Loading...</p>";

        const { data, error } = await client
            .from("schematics")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            list.innerHTML = "<p>Failed to load schematics.</p>";
            console.error(error);
            return;
        }

        if (!data || data.length === 0) {
            list.innerHTML = "<p>No schematics uploaded yet.</p>";
            return;
        }

        list.innerHTML = "";

        data.forEach(item => {
            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <p><strong>Tags:</strong> ${item.tags.join(", ")}</p>

                <img src="https://gthgxmyccwsygbopksgz.supabase.co/storage/v1/object/public/schematics/images/${item.image}"
                    style="width: 200px; border: 1px solid #00ff88; border-radius: 6px; margin-bottom: 10px;">

                <p><strong>File:</strong> ${item.file}</p>
            `;

            list.appendChild(card);
        });
    }

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
            const page = document.getElementById("page-" + btn.dataset.page);
            page.classList.add("active");

            // Load schematics when entering Manage page
            if (btn.dataset.page === "manage") {
                loadSchematics();
            }
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
        const tags = document.getElementById("schem-tags").value
            .split(",")
            .map(t => t.trim())
            .filter(Boolean);

        try {
            await client.storage.from("schematics").upload(`schems/${schemFile.name}`, schemFile);
            await client.storage.from("schematics").upload(`images/${imgFile.name}`, imgFile);

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

} // END ADMIN NAMESPACE


