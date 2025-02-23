$(document).ready(function() {
  $("#navbar-placeholder").load("navbar.html");
});

$(document).ready(function () {
  if (localStorage.getItem("isLoggedIn")) {
    $("#account-dropdown").show();
  } else {
    $("#account-dropdown").hide();
  }
});

function signOut() {
  console.log("Before clearing localStorage:", localStorage.getItem("isLoggedIn"));
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("username");
  alert("You have been signed out.");
  window.location.href = "/index.html";
  console.log("After clearing localStorage:", localStorage.getItem("isLoggedIn"));
}
