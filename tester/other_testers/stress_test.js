const { 
    randomUsername, 
    randomizeNUsernames, 
    registerUserWithApi, 
    deleteUserWithApi 
} = require('../e2e/utils.js');

const userAmount = Number(process.argv[2] || 1);

async function main() {

    console.log("Randomizing", userAmount, "usernames");
    const usernames = randomizeNUsernames(userAmount);
    console.log("Randomizing ready");

    const password = 'asdasdasd';

    console.log("Registering", userAmount, "profiles");
    let createdUsers = [];
    for (let username of usernames) {
        try {
            const response = await registerUserWithApi(username, password);
            console.log("Registering", username, "=>", response.status);
            if (response.status != 200) {
                console.log("Stopping");
                break;
            }

            // Extract token from response
            const setCookie = response.headers.get('set-cookie');
            const tokenMatch = setCookie?.match(/auth_token=([^;]+)/);
            const token = tokenMatch ? tokenMatch[1] : null;

            createdUsers.push({ username, token });        
        } catch (err) {
            console.error("Error registering", username, err);
            break;
        }
    }
    console.log("Registered", createdUsers.length, "profiles");

    console.log("Deleting all created profiles");
    for (let user of createdUsers) {
        try {
            const result = await deleteUserWithApi(user.username, user.token);
            console.log("Deleted:", user.username, "=>", result.status);
        } catch (err) {
            console.error("Error deleting", user.username, err);
        }
    }
    console.log("Ready");
}

main();

