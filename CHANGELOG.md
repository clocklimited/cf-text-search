## 1.1.0
#### modify the first argument to `#search()` to be either a string or an array

## 1.0.0

- Refactor out `_textIndex` properties in favour of using mongo's full text search
capabilities ([introduced in v2.6](http://docs.mongodb.org/manual/core/index-text/)).

- Remove the `natural` module as the tokenising and stemming is done internally in mongodb.

### Updating from 0.x

#### Tokenizers no longer need to be provided.
Indexes need to be setup on the collection with appropriate columns and weights applied.

**Before example**:

Code:
```js
service.search = textSearch(service, { body: textSearch.tokenize })
```

Indexes: No indexes previously required.

**After Example**

Code:
```js
service.search = textSearch(service)
```

Indexes:
```
db.article.ensureIndex({ body: 'text' })
```

Example of setting up the index (including weights) can be viewed on the docs:
[http://docs.mongodb.org/manual/tutorial/control-results-of-text-search/](http://docs.mongodb.org/manual/tutorial/control-results-of-text-search/)

#### `keywords` passed into the `#search()` function now needs to be a string, not an array
