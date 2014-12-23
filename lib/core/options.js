var rs = require('../RestyStone'),
    _ = require("underscore");

function checkRequired(key) {
    if (! rs.keystone.get(key)) {
        throw new Error('resty-stone option "' + key + '" is missing.');
    }
}

function passDefault(val, key) {
    if (! rs.keystone.get(key)) {
        rs.keystone.set(key, val);
    }
}

function options() {
    var defaults = {
        'resty api base address': "/api",
        'resty auth type': rs.enums.AUTH_TYPE.TOKEN,
        'resty token header': "api-token"
    }

    var required = [
        'resty meta location'
    ]


    if (rs.keystone.get('resty auth type') == rs.enums.AUTH_TYPE.TOKEN) {
        if (! rs.keystone.get('resty token header')) {
            utils.stdOutAndKill('\nInvalid resty-stone Configuration:\nOption "resty token header" is not set.\n');
        }

        if (! rs.keystone.get('cookie secret')) {
            utils.stdOutAndKill('\nInvalid resty-stone Configuration:\nOption "cookie secret" is not set.\n');
        }
    }

    required.forEach(checkRequired);
    _.forEach(defaults, passDefault);
}

options();