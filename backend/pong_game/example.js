//this is just an example on how to handle client disconnect or rferesh, html example stuff

//first detect its closed, as we loose access to webscoket communication if thats the case

webSocket.onclose = () => {
  console.log("WebSocket closed — probably a disconnect or refresh.");
  sessionStorage.setItem("wasDisconnected", "true"); // storing somekind of session indicator
  // this will help us not restart the whole game init for example
};

const wasDisconnected = sessionStorage.getItem("wasDisconnected");
if (wasDisconnected === "true") {
  console.log("Reconnecting after disconnect...");
  sessionStorage.removeItem("wasDisconnected");

  const token = sessionStorage.getItem("playerToken");
  //the player token should be also stored in session
  //we do not need to handle player 2 in local or remote
  // the reason for this is, that local play player 1 is the one running the game and the one with the open websocket 
  // remote play each player gets their own websocket , their own session, using the exact same file ran paralele 
  const gameId = sessionStorage.getItem("gameId");

  const ws = new WebSocket("ws://localhost:3000/ws");
  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: "reconnect",
      token,
      gameId
    }));
  };
}

// this is how we store the data
sessionStorage.setItem("playerToken", urlParams.get("playerToken"));
sessionStorage.setItem("gameId", urlParams.get("gameId"));

const isReconnect = sessionStorage.getItem("wasDisconnected") === "true";

// this is how we could use the same html file for remote and local
if (!isReconnect) {
  // Run full game init
} else {
  // Skip init, just reconnect
}


