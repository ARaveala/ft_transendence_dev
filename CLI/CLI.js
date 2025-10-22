// CLI.js
const fetchCookie = require('fetch-cookie');
const nodeFetch = require('node-fetch');
const fetch = fetchCookie(nodeFetch);
const WebSocket = require('ws');
const inquirer = require('inquirer');

const API_BASE = 'http://localhost:3000';

async function startGameCLI() {
    try {
        // Step 1: Login
        const loginAnswers = await inquirer.prompt([
                { name: 'username', message: 'Username:' },
                { name: 'password', message: 'Password:', type: 'password' },
        ]);

        const loginRes = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginAnswers),
        });

        if (!loginRes.ok) {
            console.error('❌ Login failed. Check your credentials.');
            const errorText = await loginRes.text();
            console.error('Server response:', errorText);
            return;
        }

        console.log('✅ Logged in successfully.');

        // Step 2: Prompt game settings
        const answers = await inquirer.prompt([{
            name: 'mode',
            type: 'list',
            message: 'Select player mode:',
            choices: ['guest', 'login'],
        }]);

        // Step 3: Create Game
        const createRes = await fetch(`${API_BASE}/api/create-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'local',
                mode: 'vs',
            }),
        });

        if (!createRes.ok) throw new Error(`Create game failed: ${createRes.statusText}`);

        const { gameId } = await createRes.json();
        console.log('🎮 Game created with ID:', gameId);

        // Step 4: Join Game
        const joinRes = await fetch(`${API_BASE}/api/join-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameId,
                type: answers.mode,
                mode: 'local',
                player_count: 2,
            }),
        });

        const joinData = await joinRes.json();
        console.log('🙋 Player joined:', joinData);

        // Step 5: Start Game
        const startRes = await fetch(`${API_BASE}/api/start-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId }),
        });

        const startData = await startRes.json();
        console.log('✅ Game started!');
        console.log('Player Tokens:', startData.playerTokens);


        // Step 5: create WebSocket	
        const player1Token = startData.playerTokens.player1;
        const ws = new WebSocket("ws://localhost:3000/ws");
        ws.onopen = (event) => {
            console.log("WebSocket connections opened.");
            console.log("Sending init message gameId:", gameId);
            ws.send(JSON.stringify({
                gameId: gameId, 
                type: 'initPlayer', 
                token: player1Token
            }));
        }
        ws.on('close', () => {
            console.log("WebSocket connection closed");
        });

        let p1score = 0;
        let p2score = 0;

        // Step 6: Make websocket talk to server
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type == 'playerInit_ack') {
                ws.send(JSON.stringify({
                    type: "init",
                    gameId: gameId,
                    token: player1Token,
                    payload: {
                        height: 500,
                        width: 1000,
                        ballSize: 10,
                        paddleHeight: 50,
                        paddleWidth: 10,
                        paddleOffset: 50,
                        ballSpeed: 1,
                        paddleSpeed: 1,
                        powerUp: false
                    }
                }));
            } else if (data.type == 'init_ack') {
                ws.send(JSON.stringify({
                    gameId: gameId,
                    type: 'start_loop',
                    token: player1Token
                }));
            } else if (data.type == 'update_score') {
                p1score = data.player1_score;
                p2score = data.player2_score;
                ws.send(JSON.stringify({
                    type: "resetPositions",
                    resetTargets: [
                        "ball",
                        "gameRunning"
                    ]
                }));
            }
        }

        // Step 7: Prompt user
        while (true) {
            const answer = await inquirer.prompt([
                {
                    name: 'selection',
                    type: 'list',
                    message: 'Choose:',
                    choices: ['See score', 'Quit']
                }
            ]);
            if (answer.selection == 'Quit') {
             ws.close();
             return;
            } else if (answer.selection == 'See score') {
                console.log("Score:", p1score, "-", p2score);
            }
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

startGameCLI();

