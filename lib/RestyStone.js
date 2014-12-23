var path = require("path");

function RestyStone() {
}

var instance;
function init(keystone) {
    instance = new RestyStone();
    module.exports = instance;

    if (keystone) {
        instance.keystone = keystone;
    }
    else {
        instance.keystone = require("../../keystone");
    }

    instance.version = require("../package.json").version;
    instance.keystoneVersion = require("../package.json").keystoneVersion;
    instance.enums = require("./core/enums");
    instance.events = require("./core/restyEvents");
    instance.registerCustomType = require('./core/customTypes').registerCustomType;
    instance.start = require("./core/start");
    instance.router = require("./RestRoute");
    instance.RestList = require("./RestList");
    instance.ApiException = require("./models/ApiException");
    instance.ResponseContainer = require("./models/ResponseContainer");

    try {
        require('resty-stone-customtypes')(instance);
    }
    catch (e) {
    }

    return instance;
}
module.exports = init;


