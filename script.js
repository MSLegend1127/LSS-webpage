function updateProgress() {
    let progressValue = document.getElementById("progressValue").value;
    let progressFill = document.getElementById("progressFill");
    let progressText = document.getElementById("progressText");

    if (progressValue < 0) progressValue = 0;
    if (progressValue > 100) progressValue = 100;

    progressFill.style.width = progressValue + "%";
    progressText.innerText = progressValue + "%";

    // Change color based on percentage
    if (progressValue <= 30) {
        progressFill.style.background = "#CC241D"; // Red
    } else if (progressValue <= 70) {
        progressFill.style.background = "#FABD2F"; // Yellow
    } else {
        progressFill.style.background = "#8EC07C"; // Green
    }
}
