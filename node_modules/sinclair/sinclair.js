const req_factory = require('./src/request')
const yaml = require('js-yaml')
const fs = require('fs')

module.exports = (serviceNode, factorySource) => {
  let srcFile = factorySource || './sinclair.yml'
  let depMap = yaml.safeLoad(fs.readFileSync(srcFile))
  let exportVals = {}

  let svc = depMap.services[serviceNode]
  let service = require(`${svc.source}`)

  for (let exp in service) {
    exportVals[exp] = args => {
      let req = req_factory.request()

      req.on('send', () => {
        if (svc.async === false) {
          try {
            service[exp](args, data => {
              req.emit('success', data)
            })
          } catch (e) {
            req.emit('error', e)
          }
        } else if (svc.async === true) {
          let p = Promise.resolve(service[exp](args))

          p
            .then(data => {
              req.emit('success', data)
            })
            .catch(err => {
              req.emit('error', err)
            })
        }
      })

      return req
    }
  }

  return exportVals
}
