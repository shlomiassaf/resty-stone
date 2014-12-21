var enums  = require("./enums"),
    nodeUtil = require('util'),
    EventEmitter = require('events').EventEmitter,
    _ = require("underscore");

function RestyEvents() {
    var self = this;
    this.fire = function() {
        self.emit.apply(self, _.toArray(arguments));
    }
}
nodeUtil.inherits(RestyEvents, EventEmitter);

module.exports = new RestyEvents();