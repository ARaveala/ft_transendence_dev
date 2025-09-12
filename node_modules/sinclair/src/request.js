function Request() {
  if (!(this instanceof Request)) return new Request()

  let events = {}
  let KNOWN_EVENTS = ['success', 'error', 'send']

  function emit(event, val) {
    if (!KNOWN_EVENTS.includes(event))
      throw new Error(`Unknown event - ${event}`)

    events[event](val)
  }

  function on(event, callback) {
    if (!KNOWN_EVENTS.includes(event))
      throw new Error(`Unknown event - ${event}`)

    if (typeof callback !== 'function')
      throw new Error(`Expected typeof function, found ${typeof callback}`)

    events[event] = callback
  }

  function preSend(successFunction) {
    if (typeof events['success'] !== 'function')
      throw new Error('No function for success event found')
    else if (typeof events['error'] !== 'function')
      throw new Error('No function for error event found')
    else successFunction()
  }

  return {
    on: on,
    emit: emit,
    send: params => {
      try {
        preSend(() => {
          emit('send', params)
        })
      } catch (e) {
        throw e
      }
    }
  }
}

module.exports = {
  request: () => {
    return new Request()
  }
}
