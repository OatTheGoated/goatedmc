// ===============================
// ADMIN NAMESPACE CHECK
// ===============================
if (!document.body.classList.contains("admin")) {
    // Not on admin page, do nothing
    console.warn("[Admin] Admin namespace not active.");
} else {

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

    const schemList     = document.getElementById("schem-list");
    const loginError    = document.getElementById("login-error");

    // ===============================
    // SMALL HELPERS
    // ===============================
    function setText(el, text) {
        if (el) el.innerText = text;
    }

    function setHTML(el, html) {
        if (el) el.innerHTML = html;
    }

    function setDisplay(el, value) {
        if (el) el.style.display = value;
    }

    function disableButton(btn, disabled, labelWhenDisabled) {
        if (!btn) return;
        btn.disabled = disabled;
        if (disabled && labelWhenDisabled) {
            btn.dataset.originalText = btn.innerText;
            btn.innerText = labelWhenDisabled;
        } else if (!disabled && btn.dataset.originalText) {
            btn.innerText = btn.dataset.originalText;
            delete btn.dataset.originalText;
        }
    }

    function parseTags(raw) {
        return raw
            .split(",")
            .map(t => t.trim())
            .filter(Boolean);
    }

    // ===============================
    // INITIAL STATE
    // ===============================
    setDisplay(loginScreen, "none");
    setDisplay(dashboard, "none");

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
                setDisplay(bootScreen, "none");
                setDisplay(loginScreen, "block");
            }, 800);
        }
    }

    runBoot();

    // ===============================
    // LOAD SCHEMATICS LIST
    // ===============================
    async function loadSchematics() {
        if (!schemList) return;

        setHTML(schemList, "<p>Loading schematics...</p>");

        const { data, error } = await client
            .from("schematica")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            console.error("[Admin] Failed to load schematics:", error);
            setHTML(schemList, "<p class='error'>Failed to load schematics.</p>");
            return;
        }

        if (!data || data.length === 0) {
            setHTML(schemList, "<p>No schematics uploaded yet.</p>");
            return;
        }

        setHTML(schemList, "");

        data.forEach(item => {
            const card = document.createElement("div");
            card.className = "card";

            const safeTags = Array.isArray(item.tags) ? item.tags.join(", ") : "";

            const imageUrl = item.image
                ? `https://gthgxmyccwsygbopksgz.supabase.co/storage/v1/object/public/schematics/images/${item.image}`
                : "";

            card.innerHTML = `
                <h3>${item.name || "Untitled Schematic"}</h3>
                <p>${item.description || "No description provided."}</p>
                <p><strong>Tags:</strong> ${safeTags || "None"}</p>

                ${imageUrl ? `
                    <img src="${imageUrl}"
                         alt="${item.name || "Schematic image"}"
                         style="width: 200px; border: 1px solid #00ff88; border-radius: 6px; margin-bottom: 10px;">
                ` : ""}

                <p><strong>File:</strong> ${item.file || "Unknown"}</p>
            `;

            schemList.appendChild(card);
        });
    }

    // ===============================
    // LOGIN
    // ===============================
    if (loginBtn) {
        loginBtn.onclick = async () => {
            const email = document.getElementById("login-email")?.value.trim();
            const pass  = document.getElementById("login-password")?.value.trim();

            setText(loginError, "");

            if (!email || !pass) {
                setText(loginError, "Missing credentials.");
                return;
            }

            disableButton(loginBtn, true, "Logging in...");

            const { error } = await client.auth.signInWithPassword({
                email,
                password: pass
            });

            disableButton(loginBtn, false);

            if (error) {
                console.error("[Admin] Login error:", error);
                setText(loginError, "Access Denied.");
            } else {
                setDisplay(loginScreen, "none");
                setDisplay(dashboard, "flex");
                // Default to manage page
                const manageBtn = document.querySelector('.nav-btn[data-page="manage"]');
                if (manageBtn) manageBtn.click();
            }
        };
    }

    // ===============================
    // NAVIGATION
    // ===============================
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.onclick = () => {
            // Active state on nav buttons
            document.querySelectorAll(".nav-btn")
                .forEach(b => b.classList.remove("active"));

            btn.classList.add("active");

            // Page switching
            document.querySelectorAll(".page")
                .forEach(p => p.classList.remove("active"));

            const pageId = "page-" + btn.dataset.page;
            const page = document.getElementById(pageId);
            if (page) page.classList.add("active");

            // Load schematics when entering manage page
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

        if (!zone || !input) return;

        zone.onclick = () => input.click();

        zone.ondragover = e => {
            e.preventDefault();
            zone.classList.add("hover");
        };

        zone.ondragleave = () => zone.classList.remove("hover");

        zone.ondrop = e => {
            e.preventDefault();
            zone.classList.remove("hover");
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                input.files = e.dataTransfer.files;
            }
        };
    }

    setupDropZone("schematic-drop", "schematic-input");
    setupDropZone("image-drop", "image-input");

    // ===============================
    // UPLOAD
    // ===============================
    if (uploadBtn) {
        uploadBtn.onclick = async () => {
            setText(uploadStatus, "");
            disableButton(uploadBtn, true, "Uploading...");

            const schemFile = schemInput?.files?.[0];
            const imgFile   = imgInput?.files?.[0];

            if (!schemFile || !imgFile) {
                setText(uploadStatus, "Missing files (schematic and image required).");
                disableButton(uploadBtn, false);
                return;
            }

            const name = schemNameEl?.value.trim();
            const desc = schemDescEl?.value.trim();
            const tags = parseTags(schemTagsEl?.value || "");

            if (!name) {
                setText(uploadStatus, "Please enter a schematic name.");
                disableButton(uploadBtn, false);
                return;
            }

            try {
                // Upload schematic file
                const { error: schemErr } = await client.storage
                    .from("schematics")
                    .upload(`schems/${schemFile.name}`, schemFile, {
                        upsert: false
                    });

                if (schemErr) {
                    console.error("[Admin] Schematic upload error:", schemErr);
                    throw new Error("Failed to upload schematic file.");
                }

                // Upload image file
                const { error: imgErr } = await client.storage
                    .from("schematics")
                    .upload(`images/${imgFile.name}`, imgFile, {
                        upsert: false
                    });

                if (imgErr) {
                    console.error("[Admin] Image upload error:", imgErr);
                    throw new Error("Failed to upload image file.");
                }

                // Insert DB row
                const { error: dbErr } = await client.from("schematica").insert({
                    name,
                    description: desc,
                    tags,
                    file: schemFile.name,
                    image: imgFile.name
                });

                if (dbErr) {
                    console.error("[Admin] DB insert error:", dbErr);
                    throw new Error("Failed to save schematic record.");
                }

                setText(uploadStatus, "Upload complete! 🎉");
                // Clear form
                if (schemNameEl) schemNameEl.value = "";
                if (schemDescEl) schemDescEl.value = "";
                if (schemTagsEl) schemTagsEl.value = "";
                if (schemInput) schemInput.value = "";
                if (imgInput) imgInput.value = "";

                // Refresh list
                loadSchematics();

                // Jump to manage tab
                const manageBtn = document.querySelector('.nav-btn[data-page="manage"]');
                if (manageBtn) manageBtn.click();

            } catch (err) {
                console.error("[Admin] Upload failed:", err);
                setText(uploadStatus, "Upload failed. Check console for details.");
            } finally {
                disableButton(uploadBtn, false);
            }
        };
    }

    // ===============================
    // LOGOUT
    // ===============================
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await client.auth.signOut();
            location.reload();
        };
    }

} // END ADMIN NAMESPACE


