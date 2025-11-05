#!/bin/bash

# school computer might need this
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install node  # Install the latest version


# start backend in another terminal
gnome-terminal -- bash -c "cd backend; npm install; npm start; bash;"
sleep 1
# start front in another terminal
gnome-terminal -- bash -c "cd frontend; npm install; npm run dev; bash;"
