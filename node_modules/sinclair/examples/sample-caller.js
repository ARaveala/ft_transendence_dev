let SvcMgr = require('../sinclair')('IDemoService')

let r1 = SvcMgr.test()

r1.on('success', data => {
  console.log(data)
})

r1.on('error', err => {
  console.log(err)
})

r1.send()
