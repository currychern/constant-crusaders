var fs = require('fs')
var Q = require('q')

// Create the "class" wrapper
var File = {}

// Returns a promise containing the data in the specified file
File.readJSON = (filePath) => {
  var deferred = Q.defer()
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err)
      return deferred.reject(err)
    return deferred.resolve(JSON.parse(data))
  })
  return deferred.promise
}

// Export the module
module.exports = File

