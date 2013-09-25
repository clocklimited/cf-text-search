module.exports = textSearch

// Expose a string tokenizer from
// the natural module
module.exports.tokenize = tokenize

var natural = require('natural')
  , tokenizer = new natural.WordTokenizer()
  , _ = require('lodash')

/*
 * Text search adds a database text index property to services,
 * facilitating text searches across multiple fields.
 *
 * Pass in the service and a map of property tokenizers. A tokenizer is a function
 * that takes a property and returns an array of strings.
 *
 * Example of tokenizer usage:
 *
 * For a service that stores things that look like this:
 *
 *  { name: 'A thing'
 *  , body: 'Something about a thing'
 *  , tags [ { tag: 'thing', type: 'category' } ]
 *  }
 *
 * The map of property tokenizers would look like this:
 *
 *  { name: textSearch.tokenize // A simple string tokenizer is available
 *  , body: textSearch.tokenize
 *  , tags: function (tags) {
 *     if (Array.isArray(tags)) return tags.map(function (tag) { return tag.tag })
 *    }
 *  }
 *
 * The textSearch function returns a 'search' endpoint that can be used to search
 * the textIndex, e.g.:
 *
 *  service.search = textSearch(service, propertyTokenizers)
 *
 *  service.search([ 'my', 'search', 'terms' ], function (err, results) {
 *  })
 *
 */
function textSearch(service, propertyTokenizers) {

  function stem(words) {
    return _.uniq(words.map(function (word) {
      return natural.PorterStemmer.stem(word)
    }))
  }

  function getWordList(object) {
    var wordList = []
    Object.keys(propertyTokenizers).forEach(function (key) {
      var words = propertyTokenizers[key](object[key])
      if (Array.isArray(words)) wordList = wordList.concat(words)
    })
    return wordList
  }

  function createTextIndex(object, cb) {
    var textIndex = stem(getWordList(object))
    object._textIndex = textIndex
    cb(null, object)
  }

  service.pre('create', createTextIndex)
  service.pre('update', createTextIndex)

  function buildSearchQuery(keywords, query) {
    if (!query) query = {}
    keywords = stem(keywords)
    if (keywords.length === 1) {
      query._textIndex = { $in: keywords }
    } else if (keywords.length > 1) {
      query = { $and: [ query ] }
      keywords.forEach(function (keyword) {
        query.$and.push({ _textIndex: { $in: [ keyword ] } })
      })
    }
    return query
  }

  /*
   * Search an array of keywords in the text index. `keywords` is an array
   * of strings to match. The keyword search is an AND – i.e. it will only
   * return if all of the keywords are present in its text index.
   *
   * The last 3 arguments are the same as those of service.find()
   * to narrow and handle the search results.
   *
   * Query and options are optional, e.g.:
   *
   * search([ 'my', 'search', 'terms' ], function (err, results) { })
   * search([ 'my', 'search', 'terms' ], { author: 'Bob' }, function (err, results) { })
   * search([ 'my', 'search', 'terms' ], {}, { limit: 20 }, function (err, results) { })
   */
  function search(keywords, query, options, cb) {
    if (typeof query === 'function') {
      cb = query
      query = {}
      options = {}
    } else if (typeof options === 'function') {
      cb = options
      options = {}
    }
    var qry = buildSearchQuery(keywords, query)
    service.count(qry, function (err, count) {
      if (err) cb(err)
      service.find(qry, options, function (err, results) {
        if (err) cb(err)
        cb(null, results, count)
      })
    })
  }

  function count(keywords, query, cb) {
    service.count(buildSearchQuery(keywords, query), cb)
  }

  search.count = count

  return search

}

function tokenize(str) {
  if (typeof str !== 'string') str = ''
  return tokenizer.tokenize(str)
}