document.addEventListener("DOMContentLoaded", () => {
    const signInForm = document.getElementById("signin-form");
    const signInState = document.getElementById("sign-in-state");
    const schedule = document.getElementById("schedule");
    const tbody = document.getElementById("schedule-entries");
    const userNameSpan = document.getElementById("user-name");
    const scheduleDate = document.getElementById("schedule-date");
    const scheduleEmpty = document.getElementById("schedule-empty");
    const termsSection = document.getElementById("terms-section");
    const termsAgreeButton = document.getElementById("agree-btn");

    // Store a pending sign-in when the user must accept terms before completing
    let pendingSignIn = null;

    // Prevent the form from performing a real POST (GitHub Pages is static)
    if (signInForm) {
        signInForm.addEventListener("submit", (e) => {
            e.preventDefault();
            console.log("Prevented default form submission");
            // Submission is handled by grecaptcha callback / client code
        });
    }

    // Centralized UI switching function
    function updateUI() {
        const actorUser = getCookie("actorUser");
        console.log("updateUI called. Current user:", actorUser);

        if (actorUser) {
            fetch('../agenda.json').then((response) => response.json()).then(json => {
                tbody.innerHTML = "";
                const todayEntries = Array.isArray(json) ? json : [];

                todayEntries.forEach(entry => {
                    const tr = document.createElement("tr");

                    const timeCell = document.createElement("td");
                    const date = new Date(entry.time);
                    timeCell.textContent = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                    timeCell.setAttribute("data-label", "Time");

                    const taskCell = document.createElement("td");
                    taskCell.textContent = entry.task;
                    taskCell.setAttribute("data-label", "Event");

                    tr.appendChild(timeCell);
                    tr.appendChild(taskCell);

                    tbody.appendChild(tr);
                });

                scheduleEmpty.hidden = todayEntries.length !== 0;
            }).catch(function () {
                console.error("Failed to fetch schedule");
                scheduleEmpty.hidden = false;
            });

            signInState.style.display = "none";
            schedule.style.display = "block";
            userNameSpan.textContent = actorUser;
            console.log("Schedule displayed");
        } else {
            signInState.style.display = "flex";
            schedule.style.display = "none";
            signInForm.reset();
            console.log("Sign-in state displayed");
        }
    }

    // Initial UI check
    termsSection.style.display = "none";
    if (scheduleDate) {
        scheduleDate.textContent = new Date().toLocaleDateString([], {
            weekday: "long",
            month: "long",
            day: "numeric"
        });
    }
    updateUI();

    // Sign In handler (called by reCAPTCHA callback)
    window.onSubmit = function (token) {
        const name = document.getElementById("name").value.trim();
        const grade = document.getElementById("grade").value;

        if (!name || !grade) {
            console.log("Sign-in failed: missing fields");
            return alert("Please fill in all fields");
        }

        if (getCookie("termsAccepted") !== "true") {
            // Save the attempted sign-in and show the terms panel instead of submitting
            pendingSignIn = { name, grade, token };
            termsSection.style.display = "flex";
            console.log("Terms not accepted yet — stored pending sign-in and showing terms panel");
            return;
        }

        setCookie("actorUser", name, tilDayOver().toString());
        logSignIn(name, grade, token);
        console.log("User signed in:", name);
        updateUI(); // Update UI immediately
    };

    termsAgreeButton.addEventListener("click", () => {
        termsSection.style.display = "none";
        setCookie("termsAccepted", "true", tilDayOver().toString());
        console.log("Terms accepted — cookie set and hiding terms panel");

        if (pendingSignIn) {
            // Finalize the pending sign-in client-side to avoid a POST
            setCookie("actorUser", pendingSignIn.name, tilDayOver().toString());
            logSignIn(pendingSignIn.name, pendingSignIn.grade, pendingSignIn.token);
            console.log("Finalized pending sign-in for:", pendingSignIn.name);
            pendingSignIn = null;
            updateUI();
            return;
        }

        // No pending sign-in: nothing to submit; keep the flow client-side
        console.log("No pending sign-in to finalize after accepting terms");
    });

    // Cookie helper functions
    function setCookie(name, value, seconds) {
        document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${seconds}`;
        console.log(`Cookie set: ${name}=${encodeURIComponent(value)}`);
    }

    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (!match) return null;
        try {
            if (decodeURIComponent(match[2].replace(/\+/g, ' ')) === match[2]) {
                setCookie(name, match[2],  60 * 60 * 24 * 365);
            }
            return decodeURIComponent(match[2].replace(/\+/g, ' '));
        } catch (err) {
            return match[2];
        }
    }

    function tilDayOver() {
        const now = new Date();

        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        const elapsedSeconds = hours * 3600 + minutes * 60 + seconds;

        return (86400 - elapsedSeconds);
    }

    function logSignIn(name, grade, token) {
        console.log(`Sign In: ${name}, Grade: ${grade}, Time: ${new Date().toISOString()}`);
        const toSend = {
            name,
            grade,
            action: "attendance",
            token
        }

        fetch("https://w53rgxzdolrlhohoqmda2hx2ly0swygd.lambda-url.us-east-1.on.aws/", {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(toSend)
        })
    }

    function logSignOut(name, token) {
        console.log(`Sign Out: ${name}, Time: ${new Date().toISOString()}`);
        const toSend = {
            name,
            action: "signout",
            token
        }

        fetch("https://w53rgxzdolrlhohoqmda2hx2ly0swygd.lambda-url.us-east-1.on.aws/", {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(toSend)
        })
    }
});
