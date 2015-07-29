/* global describe, it, beforeEach */

var crudService = require('crud-service')
  , should = require('should')
  , schemata = require('schemata')
  , textSearch = require('../text-search')
  , buildSearchQuery = textSearch.buildSearchQuery
  , extendOptions = textSearch.extendOptions
  , save = require('save')('thingy',
      { logger:
        { debug: log
        , info: log
        , warn: log
        , error: log
        }
      })

function log() {}

var schema = schemata(
  { _id: { type: String }
  , title: { type: String }
  , body: { type: String }
  , tags: { type: schemata.Array(schemata({ tag: { type: String }, type: { type: String } })) }
  })

describe('Text Search (service delegate)', function () {

  var service
    , search

  beforeEach(function () {

    service = crudService('Thingy', save, schema, {})
    search = textSearch(service)

  })

  describe('search()', function () {

    it('should be a function', function () {
      search.should.be.type('function')
    })

    it('should let `query` argument be optional', function (done) {
      search('', function (err) {
        should.not.exist(err)
        done()
      })
    })

    it('should let `options` argument be optional', function (done) {
      search('', null, function (err) {
        should.not.exist(err)
        done()
      })
    })

    it('should be tested properly once a mongo mock that supports `$in` is in place')

  })

  describe('buildSearchQuery()', function () {

    it('should allow no query to be passed in', function () {
      var query = buildSearchQuery('hello')
      query.should.eql({ $text: { $search: 'hello' }})
    })

    it('should add a $text property to the query', function () {
      var query = buildSearchQuery('hello', { a: 1 })
      query.should.eql({ $text: { $search: 'hello' }, a: 1 })
    })

    it('should let `searchTerms` be an array', function () {
      var query = buildSearchQuery([ 'a', 'b', 'c', 'd' ], { a: 1 })
      query.should.eql({ $text: { $search: 'a b c d' }, a: 1 })
    })

    it('should not add a $text query if `searchTerms` is empty array', function () {
      var query = buildSearchQuery([], { a: 1 })
      query.should.eql({ a: 1 })
    })

    it('should not add a $text query if `searchTerms` is an empty string', function () {
      var query = buildSearchQuery('', { a: 1 })
      query.should.eql({ a: 1 })
    })

  })

  describe('extendOptions()', function () {

    it('should add a $meta option to return text search score', function () {
      var options = extendOptions({ skip: 10 })
      options.should.eql({ skip: 10, fields: { score: { $meta: 'textScore' } } })
    })

    it('should not override other properties in options.fields', function () {
      var options = extendOptions({ fields: { a: true } })
      options.should.eql({ fields: { a: true, score: { $meta: 'textScore' } } })
    })

  })

})
