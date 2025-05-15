const login = document.getElementById("login");
const loginEmail = document.getElementById("loginEmail");
const loginPass = document.getElementById("loginPass");

login.addEventListener("click", login2);

function login2() {
  if (loginEmail.value === "" || loginPass.value === "") {
    alert("Please fill in all fields");
    return;
  }
  const captchaResponse = grecaptcha.getResponse();
  console.log("CAPTCHA response from frontend:", captchaResponse);

  if (!captchaResponse) {
    alert("Please complete the CAPTCHA verification");
    return;
  }

  Login(loginEmail.value, loginPass.value, captchaResponse);
}

async function Login(email, password, captchaResponse) {
  try {
    console.log("Attempting login with email:", email);
    console.log("Sending CAPTCHA response:", captchaResponse);

    const response = await fetch("/App/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        captchaResponse,
      }),
    });

    const data = await response.json();
    console.log("Login response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    if (!data.token) {
      throw new Error("No token received from server");
    }
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    alert("Login successful!");
    window.location.href = "/todo";
  } catch (error) {
    console.error("Login error details:", error);
    alert(error.message || "An error occurred during login");
    grecaptcha.reset();
  }
}
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login.html";
}
