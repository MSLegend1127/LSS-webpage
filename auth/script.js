// Handle Admin Login
document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const username = document.getElementById("adminUsername").value;
    const password = document.getElementById("adminPassword").value;

    const response = await fetch("http://localhost:5000/admin/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.token) {
        // If login is successful, save token to localStorage
        localStorage.setItem("adminToken", data.token);
        document.getElementById("login-form").style.display = "none";
        document.getElementById("create-user-container").style.display = "block"; // Show the Create User button
    } else {
        alert(data.error);
    }
});

// Show Create User Form after clicking the "Create New User" button
document.getElementById("createUserBtn").addEventListener("click", () => {
    document.getElementById("create-user-container").style.display = "none"; // Hide the button
    document.getElementById("create-user-form").style.display = "block"; // Show the Create User form
});

// Handle Create New User Form submission
document.getElementById("createUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("adminToken");
    if (!token) {
        alert("You must be logged in as an admin to create users.");
        return;
    }

    const username = document.getElementById("newUsername").value;
    const email = document.getElementById("newEmail").value;
    const password = document.getElementById("newPassword").value;

    const response = await fetch("http://localhost:5000/admin/create-user", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token, // Send JWT token
        },
        body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();
    alert(data.message || data.error);

    if (data.message) {
        // Reset the form after successful user creation
        document.getElementById("create-user-form").reset();
    }
});

// Optional: You can add a logout button if you want to log out the admin
// Get the button element
const navigateButton = document.getElementById('navigateButton');

// Add an event listener for the button click
navigateButton.addEventListener('click', function() {
  // Redirect to another page (replace with your target URL)
  window.location.href = 'https://www.example.com';  // This will redirect to another page
});
