
  git branch -m araveala_test_gameRefresh PAUSED_araveala_test_gameRefresh
  git fetch origin
  git branch -u origin/PAUSED_araveala_test_gameRefresh PAUSED_araveala_test_gameRefresh
  git remote set-head origin -a
  

## Directories 
File order is created inorder to try and help keep collaboration simple.
- backend
	- /database: Handles database initilization, inserts and extraction functions.
		Includes database.sqlite file and any config files
		It also inclused the database.sqlite file and should also hold any database config files
	- /logs, right now will conatin a simple log file , inputs to log file happen through utalizing
		log("TYPE", 'details'), if const {log} = require("@logger") is in file. (fastify provides a better alternative
		that should be explored)
	- /pong_game, contains backend game logic and a index.html which is used to run the game in browser (this 
		should be 	moved to frontend eventually)
	- /routes contains api handlers for front end calls to backend , these should validate and parse at 
		least some logic and then send to the appropriate functions to handle and return values back to front end.
	- /schemas are active files that can check and validate inputs .
	- /security, this contains at this moment simple token creation and verifictaion logic
	- /shared, shared api routes and methods between back and front end in a simplified manner,
		payloads.d.ts contains excpected payloads, backend can only use this as a verifier of similar payload,
		errorcodes , incase we want to utalize more complicated selection of error codes to communicate
		between backend and front end
	- /test_harness, contains test html file , right now just for testing game creation logic 
	- /utils, an attempt to centralize some error handling format.
	- /WebSocket contains websocket handlers , which is utalized for game flow only.
- front end 
**someone from front end should fill this in**
- GeneralDocumentation , a place to put any documentation deemed useful.
- /node_modules contains install dependencies, running npm install will utalize this diretctory to install plugins (maybe should be moved to /backend)

## Git rules
DO NOT PUSH TO MAIN (dont panic if you do , git main can be reverted with previouse hashes)
- If you want to merge to main , it must go through a project review before merging and atleast 1 person must review it , notes for the review are required.
- when pushing to our branches , please make sure to write notes and include a few bullet points at least about the changes made.
- Forking will make a new repo for you.
- Dev branch (once active), should have tested and working merges from testing branches , this should be activley
pushed too and merged too , when simple tested changes have been made to prevent large conflicts

- github ci pipeline [(a tool we should learn)](GeneralDocumenations/gitCLIpipelineExample.md)
    


## chosen modules 

#### yes

- Front end module (0.5) 
- database module (0.5)
- user management (1)
- Game customization options. (0.5)
- Multiple language support (0.5)
- Expanding Browser Compatibility (0.5)
- Implement Two-Factor Authentication (2FA) and JWT (1)
- Implement WAF/ModSecurity with Hardened Configuration and HashiCorp Vault for Secrets Management (1)
- Server-Side Pong (1)
- Monitoring system. (0.5)


#### maybe
- game graphics with babylon (1) 
- Major module: Introduce an AI opponent. (1) easy to add later
- Multiplayer (more than 2 players in the same game) (1) (apparently easy , also easy to do later)
- Remote player (1)



## Tips and tricks that maybe helpful

Below is an example console.log. This is like using printf. Request body is defined first and can be all data or just 1 piece of data
console.log('Incoming user data:', request.body);

package.json has aliases :
"_moduleAliases": {
  "@db": "database",
  "@routes": "routes",
  "@utils": "utils"
  }
These are used for anything you'd normally require() or import using a relative path.

[Link to how to use](GeneralDocumenations/HOWTOSTART.md)
