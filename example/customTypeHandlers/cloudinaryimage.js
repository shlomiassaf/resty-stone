/**
 * Local type handler for CloudinaryImage.
 * DO NOT USE AS AN EXAMPLE! to create/override custom type handlers see documentation.
 */
var rs = require("resty-stone");

/**
 * Handles CloudinaryImage instances for unauthorized requests.
 */
function defaultHandler(value) {
    if (! value) return value;

    return {
        url: value.url
    };
}

/**
 * Handles CloudinaryImage instances for authorized requests.
 */
function authorizedHandler(value) {
    if (! value) return value;

    delete value.public_id;
    delete value.version;
    delete value.signature;
    delete value.resource_type;

    return value;
}

/**
 * Handles CloudinaryImage instances for admin requests.
 */
function adminHandler(value) {
    return value;
}

var handlerDefinition = {};
handlerDefinition[rs.enums.SYSTEM_PROFILES.UNAUTHORIZED] = defaultHandler;
handlerDefinition[rs.enums.SYSTEM_PROFILES.AUTHORIZED] = authorizedHandler;
handlerDefinition[rs.enums.SYSTEM_PROFILES.ADMIN] = adminHandler;

module.exports = {
    ksTypeName: "cloudinaryimage", // the name of the type as defined in keystone OR:
    ksType: rs.keystone.Field.Types.CloudinaryImage, // ksType takes precedence over ksTypeName!
    handlers: handlerDefinition // it can also handle a function object, it will be treated as 'default'.
};