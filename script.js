import { auth, database } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { ref, push, set, get, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

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
        "A. 2nd Floor Washroom 247", "B. 2nd Level Handicap Washroom 209", "C. 2nd Level Handicap Washroom 211",
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

function generateReport() {
    let reportContent = `
        <div class="logo-container" style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <img src="gir_security_logo.png" alt="GIR Security Services Inc. Logo" style="max-height: 50px;">
            <img src="casey_house_logo.png" alt="Casey House Logo" style="max-height: 50px;">
        </div>
        <h2>Patrol Report</h2>
        <p>Employee: ${currentUserName || currentUser}</p>
        <p>Patrol: ${patrolTitle.textContent}</p>
        <p>Start Time: ${startTime.textContent}</p>
        <p>End Time: ${endTime.textContent}</p>
        <p>Duration: ${duration.textContent}</p>
        <table border="1">
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
    `;

    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
        <html>
            <head>
                <title>Patrol Report</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid black; padding: 8px; text-align: left; }
                    .logo-container {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    }
                    .logo-container img {
                        max-height: 50px;
                    }
                </style>
            </head>
            <body>
                ${reportContent}
                <button onclick="window.print()">Print Report</button>
            </body>
        </html>
    `);

    // Store the report in the database
    const reportData = {
        employee: currentUserName || currentUser,
        patrol: patrolTitle.textContent,
        startTime: startTime.textContent,
        endTime: endTime.textContent,
        duration: duration.textContent,
        checkpoints: getCheckpointData(),
        date: new Date().toISOString()
    };
    push(ref(database, 'reports'), reportData);
}

function viewPastReports() {
    const reportsQuery = query(ref(database, 'reports'), orderByChild('employee'), equalTo(currentUserName || currentUser));
    get(reportsQuery).then((snapshot) => {
        if (snapshot.exists()) {
            displayReports(snapshot.val());
        } else {
            alert('No past reports found.');
        }
    }).catch((error) => {
        console.error('Error fetching reports:', error);
    });
}

function viewAllReports() {
    if (!isAdmin) {
        alert('You do not have permission to view all reports.');
        return;
    }
    get(ref(database, 'reports')).then((snapshot) => {
        if (snapshot.exists()) {
            displayReports(snapshot.val());
        } else {
            alert('No reports found.');
        }
    }).catch((error) => {
        console.error('Error fetching reports:', error);
    });
}

function displayReports(reports) {
    let reportContent = '<h2>Past Reports</h2>';
    for (let key in reports) {
        const report = reports[key];
        reportContent += `
            <div class="report">
                <h3>Report from ${new Date(report.date).toLocaleString()}</h3>
                <p>Employee: ${report.employee}</p>
                <p>Patrol: ${report.patrol}</p>
                <p>Start Time: ${report.startTime}</p>
                <p>End Time: ${report.endTime}</p>
                <p>Duration: ${report.duration}</p>
                <table border="1">
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
        report.checkpoints.forEach(checkpoint => {
            reportContent += `
                <tr>
                    <td>${checkpoint.checkpoint}</td>
                    <td>${checkpoint.date}</td>
                    <td>${checkpoint.time}</td>
                    <td>${checkpoint.result}</td>
                </tr>
            `;
        });
        reportContent += `
                    </tbody>
                </table>
            </div>
        `;
    }
    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(`
        <html>
            <head>
                <title>Past Reports</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                    th, td { border: 1px solid black; padding: 8px; text-align: left; }
                    .report { margin-bottom: 40px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
                </style>
            </head>
            <body>
                ${reportContent}
                <button onclick="window.print()">Print Reports</button>
            </body>
        </html>
    `);
}

init();

document.getElementById('login-button').addEventListener('click', login);
document.getElementById('register-button').addEventListener('click', register);
logoutButton.addEventListener('click', logout);
toggleAuth.addEventListener('click', toggleAuthForm);
startPatrolButton.addEventListener('click', startPatrol);
endPatrolButton.addEventListener('click', endPatrol);
patrolSelect.addEventListener('change', updateCheckpointList);
generateReportButton.addEventListener('click', generateReport);
document.getElementById('view-past-reports').addEventListener('click', viewPastReports);
document.getElementById('view-all-reports').addEventListener('click', viewAllReports);
