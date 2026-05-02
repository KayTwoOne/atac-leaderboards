// PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE:
const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbxG8LzbqDzRo84LTMTaDuGCkIrDWvFQhXPSCubP5CweUGScniyE5Nq-tr2UqnEsb_xX/exec"; 

document.addEventListener("DOMContentLoaded", () => {
    // These IDs now perfectly match your submit.html
    const form = document.getElementById("submitForm");
    const input = document.getElementById("hashVal");
    const btn = document.getElementById("submitBtn");
    const terminal = document.getElementById("feedbackContainer");
    const msg = document.getElementById("submitFeedback");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const hashVal = input.value.trim();
        if (!hashVal) return;

        // Lock the UI so they don't click twice
        input.disabled = true;
        btn.disabled = true;
        terminal.classList.remove("hidden", "success", "error");
        msg.textContent = "DECRYPTING HASH AND VALIDATING CHECKSUM...";

        try {
            // Send the hash to Google
            const response = await fetch(GAS_ENDPOINT, {
                method: "POST",
                body: JSON.stringify({ hash: hashVal }),
                headers: { "Content-Type": "text/plain;charset=utf-8" }
            });

            const result = await response.json();

            // Handle the Server's Response
            if (result.status === "success") {
                terminal.style.borderColor = "var(--success)";
                msg.style.color = "var(--success)";
                msg.innerHTML = `VALIDATION SUCCESSFUL.<br>RECORD SECURELY LOGGED. REDIRECTING TO DATABASE...`;

                let highlightParam = '';
                try {
                    const parts = hashVal.split('|');
                    if (parts.length >= 5) {
                        const firstName = parts[4].split(',')[0].split(':')[0].trim();
                        if (firstName) highlightParam = `?highlight=${encodeURIComponent(firstName)}`;
                    }
                } catch(e) {}

                setTimeout(() => { window.location.href = `index.html${highlightParam}`; }, 3500);
            } else {
                throw new Error(result.message || "HASH REJECTED BY SERVER.");
            }
        } catch (error) {
            // Unlock UI on failure so they can try again
            terminal.style.borderColor = "var(--danger)";
            msg.style.color = "var(--danger)";
            msg.textContent = `ERROR: ${error.message}`;
            input.disabled = false;
            btn.disabled = false;
        }
    });
});
