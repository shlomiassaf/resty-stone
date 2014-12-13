var path = require("path"),
    fs = require("fs"),
    _ = require("underscore"),
    utils = require("../utils");


var imported = utils.import_modules(__dirname, true);
var decorators = {};

var mapModules = function(module) {
    if (_.isArray(module)) {
        _.forEach(module, mapModules);
    }
    else {
        if (module.event) {
            if (! decorators.hasOwnProperty(module.event)) {
                decorators[module.event] = [];
            }
            decorators[module.event].push(module);
        }
    }
}
_.forEach(imported, mapModules);

function runDecorators(stage) {
    var args = Array.prototype.slice.call(arguments, 1);

    var applyDecorator = function(decDescriptor) {
        if (_.isArray(decDescriptor)){
            _.forEach(decDescriptor, applyDecorator);
        }
        else {
            decDescriptor.decorator.apply(decDescriptor, args);
        }
    };

    if (decorators[stage]) {
        _.forEach(decorators[stage],applyDecorator);
    }

    return;
}
module.exports.repo = decorators;
module.exports.run = runDecorators;
