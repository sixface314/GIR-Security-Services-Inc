import { auth, database } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { ref, push, set, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

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
const viewPastReportsButton = document.getElementById('view-past-reports');
const patrolTitle = document.getElementById('patrol-title');
const startTime = document.getElementById('start-time');
const endTime = document.getElementById('end-time');
const duration = document.getElementById('duration');
const checkpointList = document.getElementById('checkpoint-list');
const patrolMap = document.getElementById('patrol-map');

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
        checkButton.style.backgroundColor = 'red';
        checkButton.style.color = 'white';
        checkButton.onclick = function() {
            const now = new Date();
            dateCell.textContent = now.toLocaleDateString();
            timeCell.textContent = now.toLocaleTimeString();
            resultCell.textContent = 'Checked';
            this.style.backgroundColor = 'green';
            this.disabled = true;
            const checkpointData = {
                checkpoint: checkpoint,
                date: now.toISOString(),
                user: currentUser,
                userName: currentUserName,
                patrolNumber: selectedPatrol
            };
            push(ref(database, 'checkpoints'), checkpointData);
        };
        actionCell.appendChild(checkButton);
    });
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
    if (!gapiInited || !gisInited) {
        alert('Google API not initialized. Please try again in a moment.');
        return;
    }

    printReport();

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

async function viewPastReports() {
    if (!gapiInited || !gisInited) {
        alert('Google API not initialized. Please try again in a moment.');
        return;
    }

    try {
        const response = await gapi.client.drive.files.list({
            'pageSize': 10,
            'fields': 'files(id, name, webViewLink)',
            'q': "mimeType='text/html' and name contains 'Patrol_Report'"
        });
        
        const files = response.result.files;
        if (files && files.length > 0) {
            let fileList = 'Past Reports:\n';
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                fileList += `${i + 1}. ${file.name}: ${file.webViewLink}\n`;
            }
            alert(fileList);
        } else {
            alert('No reports found.');
        }
    } catch (err) {
        console.error('Error listing files:', err);
        alert('Failed to retrieve past reports');
    }
}

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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-button').addEventListener('click', login);
    logoutButton.addEventListener('click', logout);
    startPatrolButton.addEventListener('click', startPatrol);
    endPatrolButton.addEventListener('click', endPatrol);
    patrolSelect.addEventListener('change', updateCheckpointList);
    generateReportButton.addEventListener('click', generateReport);
    viewPastReportsButton.addEventListener('click', viewPastReports);

    gapi.load('client', gapiLoaded);
    gisLoaded();
    init();
});
