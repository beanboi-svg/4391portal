document.addEventListener("DOMContentLoaded", () => {
    const signInForm = document.getElementById("signin-form");
    const signInState = document.getElementById("sign-in-state");
    const schedule = document.getElementById("schedule");
    const tbody = document.getElementById("schedule-entries");
    const userNameSpan = document.getElementById("user-name");
    const termsSection = document.getElementById("terms-section");
    const termsAgreeButton = document.getElementById("agree-btn");

    // Centralized UI switching function
    function updateUI() {
        const actorUser = getCookie("actorUser");
        console.log("updateUI called. Current user:", actorUser);

        if (actorUser) {
            fetch('../agenda.json').then((response) => response.json()).then(json => {
                tbody.innerHTML = "";

                json.forEach(entry => { 
                    const tr = document.createElement("tr");
  
                    const timeCell = document.createElement("td");
                    const date = new Date(entry.time);
                    timeCell.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
                    const taskCell = document.createElement("td");
                    taskCell.textContent = entry.task;
  
                    tr.appendChild(timeCell);
                    tr.appendChild(taskCell);
  
                    tbody.appendChild(tr);
                });
            }).catch(function () {
                console.error("Failed to fetch schedule");
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
    updateUI();

    // Sign In handler
    signInForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const grade = document.getElementById("grade").value;

        if (!name || !grade) {
            console.log("Sign-in failed: missing fields");
            return alert("Please fill in all fields");
        }

        if (getCookie("termsAccepted") !== "true") {
            termsSection.style.display = "flex";
            console.log("Terms not accepted yet — showing terms panel and pausing sign-in");
            return;
        }

        setCookie("actorUser", name, tilDayOver().toString()); // 12 hour session
        logSignIn(name, grade);
        console.log("User signed in:", name);
        updateUI(); // Update UI immediately
    });

    termsAgreeButton.addEventListener("click", () => {
        const oneYearSeconds = 60 * 60 * 24 * 365;
        setCookie("termsAccepted", "true", oneYearSeconds);
        termsSection.style.display = "none";
        console.log("Terms accepted — cookie set and hiding terms panel");

        if (typeof signInForm.requestSubmit === "function") {
            signInForm.requestSubmit();
        } else {
            signInForm.submit();
        }
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

    function logSignIn(name, grade) {
        console.log(`Sign In: ${name}, Grade: ${grade}, Time: ${new Date().toISOString()}`);
        const toSend = {
            name,
            grade,
            action: "attendance",
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
