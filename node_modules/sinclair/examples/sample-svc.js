exports.test = (val, callback) => {
  callback(`This is working: return ${val}`)
}

exports.errorTest = () => {
  throw new Error('Successfully broken')
}
