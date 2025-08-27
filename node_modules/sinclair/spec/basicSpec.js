describe('Sinclair exists', () => {
  let sinclair = require('../sinclair')

  it('Should exist', () => {
    expect(sinclair).toBeDefined()
  })

  it('Should allow custom template filepaths', () => {
    let sampleSvc = require('../sinclair')(
      'SampleSvc',
      './spec/helpers/sample-sinclair.yml'
    )
    expect(sampleSvc).toBeDefined()
  })
})

describe('Sinclair wraps services in requests', () => {
  let sampleSvc = require('../sinclair')(
    'SampleSvc',
    './spec/helpers/sample-sinclair.yml'
  )
})
