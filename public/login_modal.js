function openAuthWidget(mode) {
  const widget = document.getElementById("auth-widget");
  const title = document.getElementById("auth-widget-title");
  const form = document.getElementById("auth-widget-form");

  if (mode === "signup") {
    title.textContent = "Sign Up";
    form.onsubmit = handleSignup;
  } else {
    title.textContent = "Log In";
    form.onsubmit = handleLogin;
  }

  form.reset();

  widget.style.display = "flex";
}

function closeAuthWidget() {
  const widget = document.getElementById("auth-widget");
  widget.style.display = "none";
}

async function handleSignup(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    alert(result.message);

    if (response.ok) {
      closeAuthWidget();
    }
  } catch (error) {
    console.error("Error during signup:", error);
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    alert(result.message);

    if (response.ok) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", username);
      window.location.href = "/explore.html";
    }
  } catch (error) {
    console.error("Error during login:", error);
  }
}

function handleLogout() {
  console.log("Logging out...");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("username");
  alert("You have been signed out.");
  window.location.href = "/index.html";
}
