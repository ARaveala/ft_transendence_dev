The point of this directory is to implement shared paths between ends and modules so that merging and changing information can be simple and intuative. 

example for frontend of how to utalise shared/apiProtocols
```ts
import { API_PROTOCOL } from 'shared/apiProtocol';

const endpoint = API_PROTOCOL.registerUser.path;
const method = API_PROTOCOL.registerUser.method;

fetch(endpoint, {
  method,
  body: JSON.stringify({ username, password }),
});
```

front exports shared/apProtocols for fecth
frontend imports sharedTypes.d.ts for type safe api calls

SharedTypes is a file that contains request and potentially reply structure/bodies for communication between front end and backend . 

The payloads at least in backend are utalized as such :

```js
/** @type {RegisterUserPayload} */
```
This does not autofill , this will let me know when im missing or including too many variables while writing code, using intellisense extension , so code editor will warn me what im missing, spelling mistakes and so on.

errorCodes.js similar concept to shared/apiprotocols.
Questions that need to be answered before we utalize them error codes.
- who handles what parsing , if backend handles some parsing is front end ready to receive the error message? 
- is there any value in seperateing the error codes or will it cause complication later down the line due to strict error code handling? 



## considerations that may fix small issues 

28.08.2025
file type .d.ts isntead of ts or js , may be the best way for shared files between node.js and typescript

one way to utalize shared files 

```yaml
services:
  backend:
    build: ./backend
    volumes:
      - ./shared:/app/shared

  frontend:
    build: ./frontend
    volumes:
      - ./shared:/app/shared
```
then import like so 

```ts
import { RegisterUserPayload } from '../shared/types';
```