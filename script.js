// Firebase and Google API imports
import { auth, database } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { ref, push, set, get } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

// Google API configuration
const CLIENT_ID = '198729776969-tn2k77s58prkukjpqg2221tsvnvljbmb.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBoyE1rRtmaMDgUYK7DZ5hoKBOJi81dCyM';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// DOM element references
const authContainer = document.getElementById('auth-container');
const patrolContainer = document.getElementById('patrol-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authToggle = document.getElementById('auth-toggle');
const toggleAuth = document.getElementById('toggle-auth');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const registerName = document.getElementById('register-name');
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');
const userName = document.getElementById('user-name');
const logoutButton = document.getElementById('logout-button');
const patrolSelect = document.getElementById('patrol-select');
const startPatrolButton = document.getElementById('start-patrol');
const endPatrolButton = document.getElementById('end-patrol');
const generateReportButton = document.getElementById('generate-report');
const patrolTitle = document.getElementById('patrol-title');
const startTime = document.getElementById('start-time');
const endTime = document.getElementById('end-time');
const duration = document.getElementById('duration');
const checkpointList = document.getElementById('checkpoint-list');
const patrolMap = document.getElementById('patrol-map');

// Global variables
let currentUser = null;
let currentUserName = null;
let patrolStartTime = null;

// Checkpoint and patrol map data
const checkpoints = {
    1: [
        "A. Ambulance Dock", "B. Basement Comms Room 024", "C. Basement Electrical Room 015",
        // ... (rest of the checkpoints)
    ],
    2: [
        "A. 2nd Floor Washroom 248", "B. 2nd Level Handicap Washroom 209", "C. 2nd Level Handicap Washroom 211",
        // ... (rest of the checkpoints)
    ],
    3: [
        "A. Courtyard side of the wooden gate", "B. Heritage House front door", "C. Blue Kit Bin",
        // ... (rest of the checkpoints)
    ]
};

const patrolMaps = {
    1: "patrol1-map.jpg",
    2: "patrol2-map.jpg",
    3: "patrol3-map.jpg"
};

// Google API initialization functions
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        redirect_uri: 'https://sixface314.github.io/GIR-Security-Services-Inc/oauth2callback',
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        generateReportButton.style.display = 'block';
    }
}

// Google Drive authentication and report upload functions
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        await uploadReport();
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

async function uploadReport() {
    let reportContent = generateReportContent();
    try {
        const file = new Blob([reportContent], {type: 'text/html'});
        const metadata = {
            'name': `Patrol_Report_${new Date().toISOString()}.html`,
            'mimeType': 'text/html',
        };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', file);

        let response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({'Authorization': 'Bearer ' + gapi.client.getToken().access_token}),
            body: form,
        });
        let result = await response.json();
        console.log('File uploaded successfully:', result);
        alert('Report uploaded successfully to Google Drive');
    } catch (err) {
        console.error('Error uploading file:', err);
        alert('Failed to upload report');
    }
}
// Continue from the previous part...

async function uploadReport() {
    let reportContent = generateReportContent();
    try {
        const file = new Blob([reportContent], {type: 'text/html'});
        const metadata = {
            'name': `Patrol_Report_${new Date().toISOString()}.html`,
            'mimeType': 'text/html',
        };
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', file);

        let response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({'Authorization': 'Bearer ' + gapi.client.getToken().access_token}),
            body: form,
        });
        let result = await response.json();
        console.log('File uploaded successfully:', result);
        alert('Report uploaded successfully to Google Drive');
    } catch (err) {
        console.error('Error uploading file:', err);
        alert('Failed to upload report');
    }
}

function generateReportContent() {
    let reportContent = `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                .logo-container { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .logo-container img { max-height: 50px; }
            </style>
        </head>
        <body>
            <div class="logo-container">
                <img src="gir_security_logo.png" alt="GIR Security Services Inc. Logo">
                <img src="casey_house_logo.png" alt="Casey House Logo">
            </div>
            <h2>Patrol Report</h2>
            <p>Employee: ${currentUserName || currentUser}</p>
            <p>Patrol: ${patrolTitle.textContent}</p>
            <p>Start Time: ${startTime.textContent}</p>
            <p>End Time: ${endTime.textContent}</p>
            <p>Duration: ${duration.textContent}</p>
            <table>
                <thead>
                    <tr>
                        <th>Checkpoint</th>
                        <th>Patrol Date</th>
                        <th>Patrol Time</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
    `;

    const rows = checkpointList.getElementsByTagName('tr');
    for (let row of rows) {
        reportContent += '<tr>';
        for (let i = 0; i < 4; i++) {
            reportContent += `<td>${row.cells[i].textContent}</td>`;
        }
        reportContent += '</tr>';
    }

    reportContent += `
                </tbody>
            </table>
        </body>
        </html>
    `;

    return reportContent;
}

// Authentication state observer
function init() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user.email;
            currentUserName = user.displayName;
            checkIfAdmin(user.uid);
            showPatrolContainer();
        } else {
            showAuthContainer();
        }
    });
}

// Check if the user is an admin
function checkIfAdmin(uid) {
    get(ref(database, `users/${uid}`)).then((snapshot) => {
        if (snapshot.exists()) {
            const isAdmin = snapshot.val().isAdmin || false;
            if (isAdmin) {
                document.getElementById('admin-panel').style.display = 'block';
            }
        }
    }).catch(error => {
        console.error("Error checking admin status:", error);
    });
}

// UI toggle functions
function showAuthContainer() {
    authContainer.style.display = 'block';
    patrolContainer.style.display = 'none';
}

function showPatrolContainer() {
    authContainer.style.display = 'none';
    patrolContainer.style.display = 'block';
    userName.textContent = currentUserName || currentUser;
    resetPatrolInfo();
}

// Reset patrol information
function resetPatrolInfo() {
    startTime.textContent = '-';
    endTime.textContent = '-';
    duration.textContent = '-';
    startPatrolButton.disabled = false;
    endPatrolButton.disabled = true;
    updateCheckpointList();
}

// User registration function
function register() {
    const name = registerName.value;
    const email = registerEmail.value;
    const password = registerPassword.value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            return updateProfile(userCredential.user, { displayName: name }).then(() => {
                return set(ref(database, 'users/' + userCredential.user.uid), {
                    name: name,
                    email: email,
                    isAdmin: false
                });
            });
        })
        .then(() => {
            alert('Registration successful');
            toggleAuthForm();
        })
        .catch((error) => {
            alert('Registration error: ' + error.message);
        });
}

// ... Continue with the next part
// User authentication functions
function login() {
    const email = loginEmail.value;
    const password = loginPassword.value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            currentUser = userCredential.user.email;
            currentUserName = userCredential.user.displayName;
            showPatrolContainer();
        })
        .catch((error) => {
            console.error('Login error:', error);
            alert('Login error: ' + error.message);
        });
}

function logout() {
    signOut(auth).then(() => {
        currentUser = null;
        currentUserName = null;
        showAuthContainer();
    }).catch((error) => {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
    });
}

// Toggle between login and registration forms
function toggleAuthForm() {
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
    authToggle.textContent = loginForm.style.display === 'none' ? 'Already have an account? Login' : 'Don\'t have an account? Register';
}

// Patrol management functions
function startPatrol() {
    patrolStartTime = new Date();
    startTime.textContent = patrolStartTime.toLocaleString();
    endTime.textContent = '-';
    duration.textContent = '-';
    startPatrolButton.disabled = true;
    endPatrolButton.disabled = false;
    updateCheckpointList();
}

function endPatrol() {
    const patrolEndTime = new Date();
    endTime.textContent = patrolEndTime.toLocaleString();
    const patrolDuration = (patrolEndTime - patrolStartTime) / 1000 / 60;
    duration.textContent = `${patrolDuration.toFixed(2)} minutes`;
    startPatrolButton.disabled = false;
    endPatrolButton.disabled = true;

    const patrolData = {
        startTime: patrolStartTime.toISOString(),
        endTime: patrolEndTime.toISOString(),
        duration: patrolDuration,
        user: currentUser,
        userName: currentUserName,
        patrolNumber: patrolSelect.value,
        checkpoints: getCheckpointData()
    };

    push(ref(database, 'patrols'), patrolData)
        .then(() => {
            console.log('Patrol data saved successfully');
        })
        .catch((error) => {
            console.error('Error saving patrol data:', error);
            alert('Failed to save patrol data. Please try again.');
        });
}

function getCheckpointData() {
    const checkpointData = [];
    const rows = checkpointList.getElementsByTagName('tr');
    for (let row of rows) {
        checkpointData.push({
            checkpoint: row.cells[0].textContent,
            date: row.cells[1].textContent,
            time: row.cells[2].textContent,
            result: row.cells[3].textContent
        });
    }
    return checkpointData;
}

function updateCheckpointList() {
    const selectedPatrol = patrolSelect.value;
    patrolTitle.textContent = `Patrol #${selectedPatrol}`;
    checkpointList.innerHTML = '';
    patrolMap.src = patrolMaps[selectedPatrol];
    checkpoints[selectedPatrol].forEach((checkpoint, index) => {
        const row = checkpointList.insertRow();
        row.insertCell(0).textContent = checkpoint;
        const dateCell = row.insertCell(1);
        dateCell.textContent = '-';
        const timeCell = row.insertCell(2);
        timeCell.textContent = '-';
        const resultCell = row.insertCell(3);
        resultCell.textContent = 'Pending';
        const actionCell = row.insertCell(4);
        const checkButton = document.createElement('button');
        checkButton.textContent = 'Check';
        checkButton.className = 'check-button unchecked';
        checkButton.onclick = function() {
            const now = new Date();
            dateCell.textContent = now.toLocaleDateString();
            timeCell.textContent = now.toLocaleTimeString();
            resultCell.textContent = 'Checked';
            this.className = 'check-button checked';
            this.disabled = true;
        };
        actionCell.appendChild(checkButton);
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-button').addEventListener('click', login);
    logoutButton.addEventListener('click', logout);
    startPatrolButton.addEventListener('click', startPatrol);
    endPatrolButton.addEventListener('click', endPatrol);
    patrolSelect.addEventListener('change', updateCheckpointList);
    generateReportButton.addEventListener('click', handleAuthClick);
    toggleAuth.addEventListener('click', toggleAuthForm);

    gapi.load('client', gapiLoaded);
    gisLoaded();
    init();
});

// Export functions if needed
export { login, logout, startPatrol, endPatrol, updateCheckpointList };
