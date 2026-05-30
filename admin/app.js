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
    const loginScreen   = document.getElementById("login-screen");
    const dashboard     = document.getElementById("dashboard");
    const bootScreen    = document.getElementById("boot-screen");
    const bootText      = document.getElementById("boot-text");

    const loginBtn      = document.getElementById("login-btn");
    const logoutBtn     = document.getElementById("logout-btn");

    const uploadBtn     = document.getElementById("upload-btn");
    const uploadStatus  = document.getElementById("upload-status");

    const schemInput    = document.getElementById("schematic-input");
    const imgInput      = document.getElementById("image-input");

    const schemNameEl   = document.getElementById("schem-name");
    const schemDescEl   = document.getElementById("schem-desc");
    const schemTagsEl   = document.getElementById("schem-tags");

    // ===============================
    // TAG SUGGESTIONS
    // ===============================
    const TAGS = [
        "Fantasy","Rustic","Modern","Gothic","Cyber",
        "Nature","Space","Suburban","Pastel","Coastal","Western",
        "Tree","House","Shop","Castle","Farm",
        "Tower","Mansion","Statue","Portal",
        "MiniGame","Redstone","Commands"
    ];

    function renderTagSuggestions() {
        const box = document.getElementById("tag-suggestions");
        if (!box) return;

        box.innerHTML = "";

        TAGS.forEach(tag => {
            const chip = document.createElement("div");
            chip.className = "tag-chip";
            chip.innerText = tag;

            chip.onclick = () => {
                let current = schemTagsEl.value.split(",").map(t => t.trim()).filter(Boolean);
                if (!current.includes(tag)) {
                    current.push(tag);
                    schemTagsEl.value = current.join(", ");
                }
            };

            box.appendChild(chip);
        });
    }

    renderTagSuggestions();

    // ===============================
    // INITIAL STATE
    // ===============================
    loginScreen.style.display = "none";
    dashboard.style.display   = "none";

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
            .from("schematica")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            console.error(error);
            list.innerHTML = "<p>Failed to load schematics.</p>";
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

            const imageUrl = `https://gthgxmyccwsygbopksgz.supabase.co/storage/v1/object/public/schematics/images/${item.image}`;

            card.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <p><strong>Tags:</strong> ${item.tags.join(", ")}</p>

                <img src="${imageUrl}"
                     style="width: 200px; border: 1px solid #00ff88; border-radius: 6px; margin-bottom: 10px;">

                <p><strong>File:</strong> ${item.file}</p>

                <div class="admin-actions">
                    <button class="btn-edit" data-id="${item.id}">Edit</button>
                    <button class="btn-delete" data-id="${item.id}">Delete</button>
                </div>
            `;

            list.appendChild(card);
        });
    }

    // ===============================
    // DELETE SCHEMATIC
    // ===============================
    document.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("btn-delete")) return;

        const id = e.target.dataset.id;

        if (!confirm("Delete this schematic?")) return;

        const { error } = await client
            .from("schematica")
            .delete()
            .eq("id", id);

        if (error) {
            alert("Delete failed.");
            console.error(error);
            return;
        }

        loadSchematics();
    });

    // ===============================
    // EDIT SCHEMATIC
    // ===============================
    document.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("btn-edit")) return;

        const id = e.target.dataset.id;

        const { data, error } = await client
            .from("schematica")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            alert("Failed to load schematic.");
            return;
        }

        schemNameEl.value = data.name;
        schemDescEl.value = data.description;
        schemTagsEl.value = data.tags.join(", ");

        uploadBtn.dataset.editId = id;

        document.querySelector('.nav-btn[data-page="upload"]').click();
    });

    // ===============================
    // LOGIN
    // ===============================
    loginBtn.onclick = async () => {
        const email = document.getElementById("login-email").value.trim();
        const pass  = document.getElementById("login-password").value.trim();
        const errorBox = document.getElementById("login-error");

        if (!email || !pass) {
            errorBox.innerText = "Missing credentials.";
            return;
        }

        const { error } = await client.auth.signInWithPassword({
            email,
            password: pass
        });

        if (error) {
            errorBox.innerText = "Access Denied.";
        } else {
            loginScreen.style.display = "none";
            dashboard.style.display = "flex";
            document.querySelector('.nav-btn[data-page="manage"]').click();
        }
    };

    // ===============================
    // NAVIGATION
    // ===============================
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.onclick = () => {

            document.querySelectorAll(".nav-btn")
                .forEach(b => b.classList.remove("active"));

            btn.classList.add("active");

            document.querySelectorAll(".page")
                .forEach(p => p.classList.remove("active"));

            const page = document.getElementById("page-" + btn.dataset.page);
            page.classList.add("active");

            if (btn.dataset.page === "manage") {
                loadSchematics();
            }
        };
    });

    // ===============================
    // DRAG & DROP HELPERS
    // ===============================
    function setupDropZone(zoneId, inputId) {
        const zone  = document.getElementById(zoneId);
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
    // UPLOAD / UPDATE
    // ===============================
    uploadBtn.onclick = async () => {
        uploadStatus.innerText = "Uploading...";

        const name = schemNameEl.value.trim();
        const desc = schemDescEl.value.trim();
        const tags = schemTagsEl.value.split(",").map(t => t.trim()).filter(Boolean);

        const editId = uploadBtn.dataset.editId;

        const schemFile = schemInput.files[0];
        const imgFile   = imgInput.files[0];

        try {
            if (editId) {
                // UPDATE MODE
                await client.from("schematica")
                    .update({
                        name,
                        description: desc,
                        tags
                    })
                    .eq("id", editId);

                uploadStatus.innerText = "Updated successfully!";
                delete uploadBtn.dataset.editId;

            } else {
                // CREATE MODE
                await client.storage
                    .from("schematics")
                    .upload(`schems/${schemFile.name}`, schemFile);

                await client.storage
                    .from("schematics")
                    .upload(`images/${imgFile.name}`, imgFile);

                await client.from("schematica").insert({
                    name,
                    description: desc,
                    tags,
                    file: schemFile.name,
                    image: imgFile.name
                });

                uploadStatus.innerText = "Upload complete!";
            }

            schemNameEl.value = "";
            schemDescEl.value = "";
            schemTagsEl.value = "";
            schemInput.value = "";
            imgInput.value = "";

            loadSchematics();
            document.querySelector('.nav-btn[data-page="manage"]').click();

        } catch (err) {
            console.error(err);
            uploadStatus.innerText = "Upload failed.";
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

