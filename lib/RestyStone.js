function RestyStone() {
}

var instance;
function init(keystone) {
    instance = new RestyStone();
    module.exports = instance;

    instance.keystone = keystone;
    instance.version = require("../package.json").version;
    instance.keystoneVersion = require("../package.json").keystoneVersion;
    instance.enums = require("./core/enums");
    instance.events = require("./core/restyEvents");
    instance.registerCustomType = require('./core/customTypes').registerCustomType;
    instance.start = require("./core/start");
    instance.router = require("./RestRoute");
    instance.RestList = require("./RestList");

    try {
        require('resty-stone-customtypes')(instance);
    }
    catch (e) {
        console.log(e);
    }

    return instance;
}
module.exports = init;


