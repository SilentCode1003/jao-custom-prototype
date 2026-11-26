// custom_prototype/index.js
const ArrayPrototype = require('./prototypes/Array');
const SchemaExtractor = require('./prototypes/SchemaExtractor');

// Automatically apply Array prototype extensions upon import
if (typeof SchemaExtractor.register === 'function') {
    SchemaExtractor.register();
}

module.exports = {
    ArrayPrototype,
    SchemaExtractor,
};