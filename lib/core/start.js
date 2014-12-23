var rs = require("../RestyStone"),
    customTypes = require('./customTypes'),
    profiles = require('./profiles'),
    utils = require("../utils");

module.exports = function(events) {
    if (rs.keystone.version != this.keystoneVersion) {
        console.warn("resty-stone might not be compatible with the version of keystone you are using.");
    }

    require("./options");

    customTypes.init();

    // we need a generator because keystone.get(resty api base address) is not set if we import at top in this file.
    rs.keystone.app.use(require("../middleware/restyBaseMiddlewareGenerator")());

    var decorators = require("../decoration");
    decorators.run("resty_onStart");

    if ('function' === typeof events) {
        events = { onStart: events };
    }
    if (!events) events = {};

    var user_onMount = events.onMount;
    events.onMount = function() {
        decorators.run("onMount");
        user_onMount && user_onMount();
    }


    // setting profiles
    // TODO: enable customization
    //enums.SYSTEM_PROFILES.UNAUTHORIZED, ranked 0 is set in profiles, this is the base profile.
    profiles.add(rs.enums.SYSTEM_PROFILES.AUTHORIZED, 1);
    profiles.add(rs.enums.SYSTEM_PROFILES.ADMIN, 999);

    return events;
}
