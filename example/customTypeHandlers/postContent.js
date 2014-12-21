var enums = require("resty-stone").enums;

/**
 * Handler for Post.content property. {brief: '', extended: ''};
 * Post.content is not an actual type, so we can not attach it to a custom type globally but we can attach it to a column.
 *
 * See routes/api/Post.js for metadata implementation (e.g: how to connect it to a column)
 */

function defaultHandler(value) {
    return {'myData': 'Is not different'};
}

var handlerDefinition = {};
handlerDefinition[enums.SYSTEM_PROFILES.UNAUTHORIZED] = defaultHandler;

/* if we want to set more profiles:
 handlerDefinition[enums.SYSTEM_PROFILES.AUTHORIZED] = authorizedHandler;
 handlerDefinition[enums.SYSTEM_PROFILES.ADMIN] = adminHandler;
 */

module.exports = {
    ksTypeName: "postContent",
    isVirtual: true, // MUST set to TRUE, otherwise resty-stone will search for a type call postContent.... there is`nt.
    handlers: handlerDefinition // it can also handle a function object, it will be treated as 'default'.
};