function show() {
  document.getElementById("menu-bar").style.cssText = "left:0%!important;";
  document.getElementById("click").className = "fa fa-times icon";
  document.getElementById("click").setAttribute("onclick", "hide()");
}

function hide() {
  document.getElementById("menu-bar").style.cssText = "left:-100%!important;";
  document.getElementById("click").className = "fa fa-bars icon";
  document.getElementById("click").setAttribute("onclick", "show()");
}

const pass = document.getElementById("pass");
const confirmPass = document.getElementById("confirm");

const register = document.getElementById("register");
const email = document.getElementById("email");

register.addEventListener("click", checkingConfrimPassword);

function checkingConfrimPassword() {
  if (email.value === "" || pass.value === "") {
    alert("email or password are missing");
  }
  if (pass.value != confirmPass.value) {
    alert("the password and confirm password are not same");
  }
  console.log(email.value, pass.value, confirmPass.value);
  signIn(email.value, pass.value, confirmPass.value);
}

async function signIn(email, password, passwordConfirm) {
  const response = await fetch("/App/Register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      passwordConfirm,
    }),
  });
  if (!response.ok) {
    alert("user already exists please login ");
  } else {
    alert("sign in sucessful you can login now");
  }
  const data = await response.json();
  console.log(data);
}

// Creating login functionality
