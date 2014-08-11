module.exports = textSearch

// Expose the query builder for testing
module.exports.buildSearchQuery = buildSearchQuery
// Expose the extend options function for testing
module.exports.extendOptions = extendOptions

var _ = require('lodash')

/*
 * The textSearch function returns a 'search' endpoint that can be used to search
 * the textIndex, e.g.:
 *
 *  service.search = textSearch(service)
 *
 *  service.search('my search terms', function (err, results) {})
 *
 * You must ensure that the correct 'text' indexes are setup in your mongo database.
 * Read the changelog for more information.
 *
 */
function textSearch(service) {

  /*
   * Search an string of searchTerms in the text index. `searchTerms` is a
   * string of words to match.
   *
   * The last 3 arguments are the same as those of service.find()
   * to narrow and handle the search results.
   */
  function search(searchTerms, query, options, cb) {
    if (typeof query === 'function') {
      cb = query
      query = {}
      options = {}
    } else if (typeof options === 'function') {
      cb = options
      options = {}
    }

    options = extendOptions(options)
    var qry = buildSearchQuery(searchTerms, query)
    service.count(qry, function (err, count) {
      if (err) return cb(err)
      service.find(qry, options, function (err, results) {
        if (err) return cb(err)
        cb(null, results, count)
      })
    })
  }

  function count(searchTerms, query, cb) {
    service.count(buildSearchQuery(searchTerms, query), cb)
  }

  search.count = count

  return search

}

function buildSearchQuery(searchString, query) {
  if (!query) query = {}
  query.$text = { $search: searchString }
  return query
}

function extendOptions(options) {
  return _.extend(options, { score: { $meta: 'textScore' } })
}
