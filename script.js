const authContainer = document.getElementById('auth-container');
const patrolContainer = document.getElementById('patrol-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authToggle = document.getElementById('auth-toggle');
const toggleAuth = document.getElementById('toggle-auth');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const registerUsername = document.getElementById('register-username');
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
let patrolStartTime = null;

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
    currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        showPatrolContainer();
    } else {
        showAuthContainer();
    }
}

function showAuthContainer() {
    authContainer.style.display = 'block';
    patrolContainer.style.display = 'none';
}

function showPatrolContainer() {
    authContainer.style.display = 'none';
    patrolContainer.style.display = 'block';
    userName.textContent = currentUser;
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
    const username = registerUsername.value;
    const password = registerPassword.value;
    const users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[username]) {
        alert('Username already exists');
    } else {
        users[username] = password;
        localStorage.setItem('users', JSON.stringify(users));
        alert('Registration successful');
        toggleAuthForm();
    }
}

function login() {
    const username = loginUsername.value;
    const password = loginPassword.value;
    const users = JSON.parse(localStorage.getItem('users')) || {};
    if (users[username] === password) {
        currentUser = username;
        localStorage.setItem('currentUser', currentUser);
        showPatrolContainer();
    } else {
        alert('Invalid username or password');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuthContainer();
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
        <p>Employee: ${currentUser}</p>
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