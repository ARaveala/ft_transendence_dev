## Directories 
File order is created inorder to try and help keep collaboration simple 
- Database for database inserts and extraction functions aswel as databse initilization.
It also inclused the database.sqlite file and should also hold any database config files
- node_modules yet to be explained
- routes contains api routes such as fastify.post('/register-user'), these are handlers for front end calls to backend , these should validate and parse at least some logic and then send to the appropriate member .? this may be to send to database to handle insertion of user or quieries back to front end such as user score.
- schemas, are files that containe parsing logic? no thats not it 


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

