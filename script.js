import { auth, database } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { ref, push, set, get } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";
import { Html5Qrcode } from "https://unpkg.com/html5-qrcode/minified/html5-qrcode.min.js";

// Google API client ID, API key, and discovery doc
const CLIENT_ID = '198729776969-tn2k77s58prkukjpqg2221tsvnvljbmb.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBoyE1rRtmaMDgUYK7DZ5hoKBOJi81dCyM';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;

const authContainer = document.getElementById('auth-container');
const patrolContainer = document.getElementById('patrol-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authToggle = document.getElementById('auth-toggle');
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
const viewPastReportsButton = document.getElementById('view-past-reports');
const patrolTitle = document.getElementById('patrol-title');
const startTime = document.getElementById('start-time');
const endTime = document.getElementById('end-time');
const duration = document.getElementById('duration');
const checkpointList = document.getElementById('checkpoint-list');
const patrolMap = document.getElementById('patrol-map');
const qrReaderElement = document.getElementById('qr-reader');

let currentUser = null;
let currentUserName = null;
let patrolStartTime = null;
let isAdmin = false;

const checkpoints = {
    1: [
        "A. Ambulance Dock", "B. Basement Comms Room 024", "C. Basement Electrical Room 015",
        "D. CEO Meeting Office SW", "E. Dining Room North Side™", "F. Basement Fire Pump/Sprinkler Room",
        "G. 2nd Level West Heritage House", "H. Penthouse Boiler Room East", "I. Penthouse Boiler Room West",
        "J. West Heritage House Double Doors", "K. Stair Well 1 Level G (Overlooking Heritage)",
        "L. SW Heritage House Exit", "M. Stair Well 1 Level G SW Emergency Exit", "N. Quiet Room",
        "O. Rooftop Garden", "P. Staff Exit (Stair 3 LvI G)", "Q. Parking Garage AV Storage",
        "R. Parking Garage Centre Pillar", "S. Heritage House Community Kitchen", "T. June Callwood Room",
        "U. Kitchen - Freezer (Inside)", "V. North East Fire Emergency Exit", "W. Main Entrance Door",
        "X. Kitchen - Gas (Check)", "Y. 222 IT room servers", "Z. 3rd floor - Heritage house fire exit Stair 7",
        "AA. Exterior garbage gate", "AB. Heritage house foundation storage room - Back panel",
        "AC. Kitchen dish wash area", "AD. Oxygen room"
    ],
    2: [
        "A. 2nd Floor Washroom 248", "B. 2nd Level Handicap Washroom 209", "C. 2nd Level Handicap Washroom 211",
        "D. 2nd Level North Corridor Washroom 204", "E. Handicap Washroom 135", "F. Washroom 134",
        "G. 102B washroom - behind reception", "H. 106 Washroom - interior", "I. 133 washroom interior",
        "J. 235 Washroom interior"
    ],
    3: [
        "A. Courtyard side of the wooden gate", "B. Heritage House front door", "C. Blue Kit Bin",
        "D. New wooden gate locking up nook area", "E. NE corner by kitchen window",
        "F. External side of East Side Staff Entrance", "G. G SE perimeter black gate (by the parking garage)"
    ]
};

const patrolMaps = {
    1: "patrol1-map.jpg",
    2: "patrol2-map.jpg",
    3: "patrol3-map.jpg"
};

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

function checkIfAdmin(uid) {
    get(ref(database, `users/${uid}`)).then((snapshot) => {
        if (snapshot.exists()) {
            isAdmin = snapshot.val().isAdmin || false;
            if (isAdmin) {
                document.getElementById('admin-panel').style.display = 'block';
            }
        }
    });
}

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

function resetPatrolInfo() {
    startTime.textContent = '-';
    endTime.textContent = '-';
    duration.textContent = '-';
    startPatrolButton.disabled = false;
    endPatrolButton.disabled = true;
    updateCheckpointList();
}

function register() {
    const name = registerName.value;
    const email = registerEmail.value;
    const password = registerPassword.value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            return updateProfile(userCredential.user, {
                displayName: name
            }).then(() => {
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
    });
}

function toggleAuthForm() {
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
    authToggle.textContent = loginForm.style.display === 'none' ? 'Already have an account? Login' : 'Don\'t have an account? Register';
}

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
    push(ref(database, 'patrols'), patrolData);
}

function getCheckpointData() {
    const rows = checkpointList.getElementsByTagName('tr');
    return Array.from(rows).map(row => {
        const cells = row.getElementsByTagName('td');
        return {
            checkpoint: cells[0].textContent,
            patrolDate: cells[1].textContent,
            patrolTime: cells[2].textContent,
            result: cells[3].textContent
        };
    });
}

function updateCheckpointList() {
    const selectedPatrol = parseInt(patrolSelect.value, 10);
    const checkpointArray = checkpoints[selectedPatrol];
    checkpointList.innerHTML = checkpointArray.map(checkpoint => `
        <tr>
            <td>${checkpoint}</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
        </tr>
    `).join('');
    patrolMap.src = patrolMaps[selectedPatrol];
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

function printReport() {
    const reportContent = generateReportContent();
    const newWindow = window.open('', '_blank');
    newWindow.document.write(reportContent);
    newWindow.document.close();
    newWindow.print();
}

function generateReport() {
    printReport();
    uploadReportToDrive();
}

async function uploadReportToDrive() {
    const reportContent = generateReportContent();
    const fileContent = new Blob([reportContent], { type: 'text/html' });
    const metadata = {
        name: 'Patrol Report',
        mimeType: 'text/html'
    };
    const accessToken = gapi.auth.getToken().access_token;
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileContent);

    try {
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form,
        });

        if (!response.ok) {
            throw new Error(`Error uploading file: ${response.statusText}`);
        }

        const file = await response.json();
        console.log('File uploaded to Google Drive:', file);
        alert('Report uploaded successfully');
    } catch (err) {
        console.error('Error uploading report to Google Drive:', err);
        alert('Failed to upload report');
    }
}

async function viewPastReports() {
    try {
        const reportsRef = ref(database, 'reports');
        const reportsSnapshot = await get(reportsRef);
        
        if (reportsSnapshot.exists()) {
            const reports = [];
            reportsSnapshot.forEach((childSnapshot) => {
                reports.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            // Sort reports by timestamp, most recent first
            reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Create a modal to display the report list
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.left = '0';
            modal.style.top = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';

            const modalContent = document.createElement('div');
            modalContent.style.backgroundColor = 'white';
            modalContent.style.padding = '20px';
            modalContent.style.borderRadius = '5px';
            modalContent.style.maxWidth = '80%';
            modalContent.style.maxHeight = '80%';
            modalContent.style.overflow = 'auto';

            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.onclick = () => document.body.removeChild(modal);

            const reportList = document.createElement('ul');
            reports.forEach((report) => {
                const listItem = document.createElement('li');
                const reportLink = document.createElement('a');
                reportLink.href = '#';
                reportLink.textContent = `Report from ${new Date(report.timestamp).toLocaleString()}`;
                reportLink.onclick = (e) => {
                    e.preventDefault();
                    displayReport(report.content);
                };
                listItem.appendChild(reportLink);
                reportList.appendChild(listItem);
            });

            modalContent.appendChild(reportList);
            modalContent.appendChild(closeButton);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
        } else {
            alert('No reports found.');
        }
    } catch (err) {
        console.error('Error retrieving reports:', err);
        alert('Failed to retrieve past reports');
    }
}

function displayReport(reportContent) {
    const viewerWindow = window.open('', '_blank');
    viewerWindow.document.write(reportContent);
    viewerWindow.document.close();
}

// Google API initialization
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
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        generateReportButton.disabled = false;
        viewPastReportsButton.disabled = false;
    }
}

function handleAuthClick() {
    tokenClient.callback = async (response) => {
        if (response.error) {
            console.error('Error obtaining OAuth token:', response.error);
            alert('Failed to authenticate with Google Drive.');
            return;
        }
        console.log('OAuth token obtained');
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function startQRCodeScan() {
    const html5QrCode = new Html5Qrcode("qr-reader");
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        console.log(`QR Code detected: ${decodedText}`);
        alert(`QR Code detected: ${decodedText}`);
        html5QrCode.stop();
    };

    html5QrCode.start({ facingMode: "environment" }, {
        fps: 10,
        qrbox: { width: 250, height: 250 }
    }, qrCodeSuccessCallback)
    .catch(err => {
        console.error(`Error starting QR code scan: ${err}`);
        alert('Failed to access camera for QR code scanning.');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-button').addEventListener('click', login);
    logoutButton.addEventListener('click', logout);
    startPatrolButton.addEventListener('click', startPatrol);
    endPatrolButton.addEventListener('click', endPatrol);
    patrolSelect.addEventListener('change', updateCheckpointList);
    generateReportButton.addEventListener('click', generateReport);
    viewPastReportsButton.addEventListener('click', viewPastReports);
    document.getElementById('start-qr-scan').addEventListener('click', startQRCodeScan);

    gapi.load('client', gapiLoaded);
    gisLoaded();
    init();
});
