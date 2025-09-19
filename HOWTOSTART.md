# instructions
These are baisic instructions for the programme that has been structured, this is just so that you can get a feel for how this interaction can look and be managed.

required installs :
- node.js & npm
- thunder client vs code extension (not required but nicer tool for testing)

---

To Build the backend image run command:
docker build -t backend .

Then to run server run command:
docker run --rm -p 3000:3000 backend

---

Navigate to practise1 folder

Install dependencies from package.json using npm install, this will create a node_modules folder

npm start (to start the "server")

Open thunder client and make new request

----

Chose html method GET from drop down and write http://localhost:3000/user/1

This should return user profile from db visable in thunder clients response window.
- Follow the code , routes/user.js function getUser.

----

You can make a POST request http://localhost:3000/register-user
This requires you fill in also json below 

```json
{
	"username": "name",
	"password": "pass",
	"score": 100,
	"status": "online"
}
```
- Follow the code routes/user.js  resgisterUser().

---

WebSocket functionality is in progress—basic setup is working, but fuller features are still being developed. 

Please fork or branch code and play with it, break it , do what you want with it.

The Dockerfile has not yet been tested .

---
To access images shell run command:
docker exec -it <images_name> sh

To access database run command in images shell:
sqlite3 data/app.sqlite

If you want to see what tables we have run command in sqlite:
.tables

If you want to see what's inside users table run command in sqlite:
SELECT * FROM users;