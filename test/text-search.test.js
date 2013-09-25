/* global describe, it, beforeEach */

var crudService = require('crud-service')
  , should = require('should')
  , schemata = require('schemata')
  , textSearch = require('../text-search')
  , readFileSync = require('fs').readFileSync
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
    search = textSearch(service,
      { title: textSearch.tokenize
      , body: textSearch.tokenize
      , tags: function (tags) {
          if (Array.isArray(tags)) {
            return tags.map(function (tag) { return tag.tag })
          } else {
            return []
          }
        }
      })

  })

  describe('createTextIndex()', function () {

    it('should tokenize and stem on create, writing the result to _textIndex on the entity', function (done) {
      service.create({ title: 'Tremendous title', body: 'Bustling body' }, function (err, entity) {
        should.not.exist(err)
        save.read(entity._id, function (err, rawObject) {
          should.not.exist(err)
          rawObject._textIndex.should.be.instanceOf(Array)
          rawObject._textIndex.should.have.length(4)
          done()
        })
      })
    })

    it('should tokenize and stem on update, writing the result to _textIndex on the entity', function (done) {
      service.create({ title: 'Tremendous title', body: 'Bustling body' }, function (err, entity) {
        should.not.exist(err)
        service.update({ _id: entity._id, title: 'Tremendous title', body: 'Big body' }, {}, function (err, entity) {
          save.read(entity._id, function (err, rawObject) {
            should.not.exist(err)
            rawObject._textIndex.should.be.instanceOf(Array)
            rawObject._textIndex.should.have.length(4)
            rawObject._textIndex.indexOf('big').should.not.equal(-1)
            done()
          })
        })
      })
    })

    it('should have no duplicate strings in the _textIndex property', function (done) {
      service.create({ title: 'One two', body: 'Two three' }, function (err, entity) {
        should.not.exist(err)
        save.read(entity._id, function (err, rawObject) {
          should.not.exist(err)
          rawObject._textIndex.should.be.instanceOf(Array)
          rawObject._textIndex.should.have.length(3)
          done()
        })
      })
    })

    it('should normalize string case in the _textIndex property', function (done) {
      service.create({ title: 'HallOW world', body: 'CASE TEst' }, function (err, entity) {
        should.not.exist(err)
        save.read(entity._id, function (err, rawObject) {
          should.not.exist(err)
          rawObject._textIndex.should.be.instanceOf(Array)
          rawObject._textIndex.should.have.length(4)
          rawObject._textIndex.forEach(function (stem) {
            stem.toLowerCase().should.equal(stem)
          })
          done()
        })
      })
    })

    it('should not leak the _textIndex property on to service level entities', function (done) {
      service.create({ title: 'Leaky', body: 'No leaking' }, function (err, entity) {
        should.not.exist(err)
        entity.should.not.have.property('_textIndex')
        service.read(entity._id, function (err, entity) {
          should.not.exist(err)
          entity.should.not.have.property('_textIndex')
          done()
        })
      })
    })

    it('should support custom tokenize functions for deep properties', function (done) {
      service.create(
          { title: 'Custom'
          , body: 'Tokenizer'
          , tags: [ { tag: 'typical', type: 'Label' } ]
          }
        , function (err, entity) {
            should.not.exist(err)
            entity.should.not.have.property('_textIndex')
            save.read(entity._id, function (err, rawObject) {
              should.not.exist(err)
              rawObject.should.have.property('_textIndex')
              rawObject._textIndex.indexOf('typical').should.not.equal(-1)
              done()
            })
          })
    })

    it('should throw an error if the passed tokenizer is not a function')
    it('should throw an error if a tokenizer is passed for a non-property')

  })

  describe('search()', function () {

    it('should be a function', function () {
      search.should.be.a('function')
    })

    it('should let `query` argument be optional', function (done) {
      search([], function (err) {
        should.not.exist(err)
        done()
      })
    })

    it('should let `options` argument be optional', function (done) {
      search([], null, function (err) {
        should.not.exist(err)
        done()
      })
    })

    it('should be tested properly once a mongo mock that supports `$in` is in place')

  })

  describe('tokenize()', function () {

    it('should return an empty array for a non-stringy arg', function () {
      textSearch.tokenize(null).should.eql([])
      textSearch.tokenize(1).should.eql([])
      textSearch.tokenize({ a: 'b' }).should.eql([])
    })

    it('should return an empty array for an empty string', function () {
      textSearch.tokenize('').should.eql([])
    })

    it('should tokenize strings, resulting in no empty strings and no non-word chars', function () {

      textSearch.tokenize('the cat sat on the mat').forEach(function (token) {
        token.should.not.equal('')
        token.length.should.be.above(0)
        should.not.exist(token.match(/\W+/))
      })

      textSearch.tokenize(readFileSync(__dirname + '/fixtures/passage.txt', 'utf-8')).forEach(function (token) {
        token.should.not.equal('')
        token.length.should.be.above(0)
        should.not.exist(token.match(/\W+/))
      })

      textSearch.tokenize(readFileSync(__dirname + '/fixtures/article.html', 'utf-8')).forEach(function (token) {
        token.should.not.equal('')
        token.length.should.be.above(0)
        should.not.exist(token.match(/\W+/))
      })

    })

  })

})