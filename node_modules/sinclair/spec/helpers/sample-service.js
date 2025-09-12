let Svc = {
  numTests: 3
}

// Test that the callback returns itself, which is a function
Svc.testCallback = (args, callback) => {
  callback(callback)
}

// Verify the return of the callback
Svc.testCallbackReturns = (args, callback) => {
  callback(true)
}

Svc.testReturnArgs = (args, callback) => {
  callback(args)
}

Svc.testThrowErros = (args, callback) => {
  throw new Error('This thrown by the sample-service')
}

exports = Svc
