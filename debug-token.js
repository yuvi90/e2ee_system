// Debug utility to check JWT token contents
// Run this in browser console: node debug-token.js

function debugToken() {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.log("No access token found in localStorage");
    return;
  }

  try {
    const parts = accessToken.split(".");
    if (parts.length !== 3) {
      console.log("Invalid JWT format");
      return;
    }

    const payload = JSON.parse(atob(parts[1]));
    console.log("JWT Payload:", payload);

    const currentTime = Date.now() / 1000;
    const isExpired = payload.exp && payload.exp < currentTime;

    console.log("Token expired:", isExpired);
    console.log("Has name field:", !!payload.name);
    console.log("Name value:", payload.name);

    if (!payload.name) {
      console.log(
        "❌ Token doesn't have name field - need to log out and log back in"
      );
      console.log(
        "To clear token, run: localStorage.removeItem('accessToken')"
      );
    }
  } catch (error) {
    console.log("Error decoding token:", error);
  }
}

// For browser console
if (typeof window !== "undefined") {
  window.debugToken = debugToken;
  console.log("Run debugToken() to check your JWT token");
}

// For Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { debugToken };
}

debugToken();
