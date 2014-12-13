var keystone = require("keystone"),
    router = require("./lib/RestRoute"),
    utils = require("./lib/utils"),
    restyBaseMiddlewareGenerator = require("./lib/middleware/restyBaseMiddlewareGenerator");

module.exports.AUTH_TYPE = {
    SESSION: 1,             // Classic KeystoneJS session authentication, CSRF vulnerable!.
    TOKEN: 2               // API Token, riding on built in session handler.
    // TODO: Support more
    // JsonWebTokens
    // OAuth1,2
}

function checkOptions() {
    if (keystone.get('resty auth type') == module.exports.AUTH_TYPE.TOKEN) {
        if (! keystone.get('resty token header')) {
            utils.stdOutAndKill('\nInvalid resty-stone Configuration:\nOption "resty token header" is not set.\n');
        }

        if (! keystone.get('cookie secret')) {
            utils.stdOutAndKill('\nInvalid resty-stone Configuration:\nOption "cookie secret" is not set.\n');
        }
    }
}

module.exports.start = function(events) {
    module.exports.checkVersionMatch();

    checkOptions();

    // we need a generator because keystone.get(resty api base address) is not set if we import at top in this file.
    keystone.app.use(restyBaseMiddlewareGenerator());

    var decorators = require("./lib/decoration");
    decorators.run("resty_onStart", keystone);

    if ('function' === typeof events) {
        events = { onStart: events };
    }
    if (!events) events = {};

    var user_onMount = events.onMount;
    events.onMount = function() {
        decorators.run("onMount", keystone);
        user_onMount && user_onMount();
    }
    return events;
}

/**
 * resty-stone version
 *
 * @api public
 */
module.exports.version = require('./package.json').version;

module.exports.checkVersionMatch = function() {
    if (keystone.version != require('./package.json').keystoneVersion) {
        console.warn("resty-stone might not be compatible with the version of keystone you are using.");
    }
}

module.exports.RestList = require("./lib/RestList");
module.exports.router = router;