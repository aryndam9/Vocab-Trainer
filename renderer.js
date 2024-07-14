function minimizeApp() {
    window.electronAPI.minimizeApp();
}

function maximizeApp() {
    window.electronAPI.maximizeApp();
}

function closeApp() {
    window.electronAPI.closeApp();
}

function openSettings() {
    window.electronAPI.openSettings();
}

function login() {
    window.electronAPI.login();
}

function logout() {
    window.electronAPI.logout();
}

function saveSettings() {
    const frequency = document.getElementById('reminder-frequency').value;
    const minimizeToTray = document.getElementById('minimize-to-tray').checked;
    window.electronAPI.setReminderFrequency(parseInt(frequency));
    window.electronAPI.setMinimizeToTray(minimizeToTray);
    closeSettings();
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

window.electronAPI.onLoadVocabTrainer((event, url) => {
    document.getElementById('content').src = url;
});

window.electronAPI.onShowSettings(() => {
    document.getElementById('settings-modal').style.display = 'block';
});

window.electronAPI.onShowLoginButton(() => {
    // You can add logic here if needed when the login button should be shown
});