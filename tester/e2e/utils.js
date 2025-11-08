// utils.js

const API_BASE = 'http://localhost:3000';

async function registerUserWithApi(username, password) {
    const response = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ username, password })
    });
    return response;
}

async function deleteUserWithApi(username, token) {
    const response = await fetch(`${API_BASE}/api/profile`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `auth_token=${token}`
        },
        body: JSON.stringify({ username })
    });
    return response;
}

function randomUsername() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const lettersAndNumbers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // First character must be a letter
    const firstChar = letters.charAt(Math.floor(Math.random() * letters.length));

    let result = firstChar;

    // Generate remaining 11 characters (letters or numbers)
    for (let i = 0; i < 11; i++) {
        result += lettersAndNumbers.charAt(Math.floor(Math.random() * lettersAndNumbers.length));
    }

    return result;
}

// Randomizes n amount of unique usernames
function randomizeNUsernames(n) {
    let arr = [];
    for (let i = 0; i < n; ++i) {
        let new_username = randomUsername();
        while (arr.includes(new_username)) {
            new_username = randomUsername();
        }
        arr.push(new_username);
    }
    return arr;
}

// Export the function
module.exports = { randomUsername, randomizeNUsernames, registerUserWithApi, deleteUserWithApi };

