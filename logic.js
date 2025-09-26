document.addEventListener("DOMContentLoaded", () => {
    const signInForm = document.getElementById("signin-form");
    const signInState = document.getElementById("sign-in-state");
    const signOutState = document.getElementById("sign-out-state");
    const userNameSpan = document.getElementById("user-name");
    const signOutBtn = document.getElementById("sign-out-btn");

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

        setCookie("user", name, 43200); // 1 hour session
        logSignIn(name, grade);
        console.log("User signed in:", name);
        updateUI(); // Update UI immediately
    });

    // Sign Out handler
    signOutBtn.addEventListener("click", () => {
        const name = getCookie("user");
        if (!name) {
            console.log("Sign-out failed: no user cookie found");
            return;
        }
        logSignOut(name);
        deleteCookie("user");
        console.log("User signed out:", name);
        updateUI(); // Update UI immediately
    });

    // Cookie helper functions
    function setCookie(name, value, seconds) {
        document.cookie = `${name}=${value}; path=/; max-age=${seconds}`;
        console.log(`Cookie set: ${name}=${value}`);
    }

    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }

    function deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        console.log(`Cookie deleted: ${name}`);
    }

    // Placeholder spreadsheet logging functions
    function logSignIn(name, grade) {
        console.log(`Sign In: ${name}, Grade: ${grade}, Time: ${new Date().toISOString()}`);
        const toSend = {
            name,
            grade,
            action: "signin"
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

    function logSignOut(name) {
        console.log(`Sign Out: ${name}, Time: ${new Date().toISOString()}`);
        const toSend = {
            name,
            action: "signout"
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
