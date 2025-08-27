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

errorCodes.js similar concept to shared/apiprotocols.
Questions that need to be answered before we utalize them error codes.
- who handles what parsing , if backend handles some parsing is front end ready to receive the error message? 
- is there any value in seperateing the error codes or will it cause complication later down the line due to strict error code handling? 

