## Directories 
File order is created inorder to try and help keep collaboration simple 
- Database for database inserts and extraction functions aswel as databse initilization.
It also inclused the database.sqlite file and should also hold any database config files
- node_modules loaded modules and 
- routes contains api routes such as fastify.post('/register-user'), these are handlers for front end calls to backend , these should validate and parse at least some logic and then send to the appropriate functions, to handle and return values back to front end.
- schemas are active files that can check and validate inputs aswell as run actions (bad explanation)

## Git rules
DO NOT PUSH TO MAIN (dont panic if you do , git main can be reverted wit previouse hashes)
- If you want to merge to main , it must go through a project review before merging and atleast 1 person must review it , notes for the review are required.
- when pushing to our branches , please make sure to write notes and include a few bullet points at least about the changes made.
- Forking will make a new repo for you.
- github ci pipeline (a tool we should learn)
    
    apply example here 
  


## chosen modules 

#### yes

- Front end module (0.5) 
- database module (0.5)
- user management (1)
- Game customization options. (0.5)
- Multiple language support (0.5)
- Minor module: Expanding Browser Compatibility (0.5)
- Implement Two-Factor Authentication (2FA) and JWT (1)
- Implement WAF/ModSecurity with Hardened Configuration and HashiCorp Vault for Secrets Management (1)
-  Server-Side Pong (1)
-   Minor module: Monitoring system. (0.5)


#### maybe
game graphics with babylon (1) 
Major module: Introduce an AI opponent. (1) easy to add later




maybe
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

