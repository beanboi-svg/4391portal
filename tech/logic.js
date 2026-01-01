document.addEventListener("DOMContentLoaded", () => {
    const signInForm = document.getElementById("signin-form");
    const signInState = document.getElementById("sign-in-state");
    const signOutState = document.getElementById("sign-out-state");
    const userNameSpan = document.getElementById("user-name");
    const signOutBtn = document.getElementById("sign-out-btn");
    const termsSection = document.getElementById("terms-section");
    const termsAgreeButton = document.getElementById("agree-btn");

    // Centralized UI switching function
    function updateUI() {
        const user = getCookie("user");
        console.log("updateUI called. Current user:", user);

        if (user) {
            signInState.style.display = "none";
            signOutState.style.display = "flex"; // changed from 'block' to 'flex'
            userNameSpan.textContent = user;
            console.log("Sign-out state displayed");
        } else {
            signInState.style.display = "flex";   // changed from 'block' to 'flex'
            signOutState.style.display = "none";
            signInForm.reset();
            console.log("Sign-in state displayed");
        }
    }

    // Initial UI check
    termsSection.style.display = "none";
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
            termsSection.style.display = "flex";
            console.log("Terms not accepted yet — showing terms panel and pausing sign-in");
            return;
        }

        setCookie("user", name, tilDayOver());
        logSignIn(name, grade, token);
        console.log("User signed in:", name);
        updateUI(); // Update UI immediately
    };

    termsAgreeButton.addEventListener("click", () => {
        setCookie("termsAccepted", "true", tilDayOver());
        termsSection.style.display = "none";
        console.log("Terms accepted — cookie set and hiding terms panel");

        if (typeof signInForm.requestSubmit === "function") {
            signInForm.requestSubmit();
        } else {
            signInForm.submit();
        }
    });

    // Sign Out handler (called by reCAPTCHA callback)
    window.onSignOut = function (token) {
        const name = getCookie("user");
        if (!name) {
            console.log("Sign-out requested but no user is signed in");
            return;
        }
        logSignOut(name, token);
        deleteCookie("user");
        console.log("User signed out:", name);
        updateUI(); // Update UI immediately
    };

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

    function deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        console.log(`Cookie deleted: ${name}`);
    }

    function tilDayOver() {
        const now = new Date();

        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        const elapsedSeconds = hours * 3600 + minutes * 60 + seconds;

        return (86400 - elapsedSeconds);
    }

    // Placeholder spreadsheet logging functions
    function logSignIn(name, grade, token) {
        console.log(`Sign In: ${name}, Grade: ${grade}, Time: ${new Date().toISOString()}`);
        const toSend = {
            name,
            grade,
            action: "signin",
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
