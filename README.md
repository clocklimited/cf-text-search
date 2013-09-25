# cf-text-search

Add full-text search functionality across multiple fields on cf services

Text search adds a database text index property to services,
facilitating text searches across multiple fields.

## Installation

```
npm install cf-text-search
```

## Usage

```js
var textSearch = require('cf-text-search')
```

Pass in the service and a map of property tokenizers. A tokenizer is a function
that takes a property and returns an array of strings.

Example of tokenizer usage:

For a service that stores things that look like this…

```js
{ name: 'A thing'
, body: 'Something about a thing'
, tags [ { tag: 'thing', type: 'category' } ]
}
```

The map of property tokenizers would look like this…

```js
{ name: textSearch.tokenize // A simple string tokenizer is available
, body: textSearch.tokenize
, tags: function (tags) {
    if (Array.isArray(tags)) return tags.map(function (tag) { return tag.tag })
  }
}
```

The textSearch function returns a 'search' endpoint that can be used to search
the textIndex, e.g.:

```js
service.search = textSearch(service, propertyTokenizers)

service.search([ 'my', 'search', 'terms' ], function (err, results) {
})
```

## Credits
Built by developers at [Clock](http://clock.co.uk).

## Licence
Licensed under the [New BSD License](http://opensource.org/licenses/bsd-license.php)
