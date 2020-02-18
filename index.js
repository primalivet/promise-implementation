const fs = require('fs')
const MyPromise = require('./MyPromise')

const readFile = (encoding, filename) => {
  return new MyPromise((resolve, reject) => {
    fs.readFile(filename, encoding, (err, content) => {
      if (err) {
        reject(err)
      }
      resolve(content)
    })
  })
}

readFile('utf8', 'de_gra_tinningarnas_charm-emil_jensen.txt')
  .then(console.log)
