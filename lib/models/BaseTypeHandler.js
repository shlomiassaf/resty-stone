var _ = require("underscore");

/**
 * Handles transformation of keystone field types.
 *
 * @param ksTypeName The name of the field
 * @param handlers an object with profile/handler pairs or a single function that will be the default profile handler.
 * @constructor
 */
function BaseTypeHandler(ksTypeName, handlers) {
    this.ksTypeName = ksTypeName;

    if ("function" === typeof handlers) {
        this.handlers = {default: handlers};
    }
    else {
        this.handlers = _.extend({}, handlers);
    }

}
BaseTypeHandler.prototype.ksTypeName = undefined;
BaseTypeHandler.prototype.handlers = undefined;

module.exports = BaseTypeHandler;