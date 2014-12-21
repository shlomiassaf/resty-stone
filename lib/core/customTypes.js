var path = require('path'),
    rs = require('../RestyStone'),
    Types = rs.keystone.Field.Types,
    profiles = require('../core/profiles'),
    CustomTypeHandler = require('../models/CustomTypeHandler'),
    BaseTypeHandler = require('../models/BaseTypeHandler'),
    utils = require('../utils'),
    _ = require("underscore");

/**
 * Holds a map of field name to field for KeystoneJS Fields (Text, Html, CloudinaryImage etc...)
 * The mapping is type/Field where type is the string representation of Field (Field.type)
 */
var fieldTypeMap;

/**
 * Holds a map of REGISTERED field name to field for KeystoneJS Fields (Text, Html, CloudinaryImage etc...)
 * Registered fields are fields which have custom type handlers in resty-stone.
 */
var registeredFieldTypeMap;
var registeredVirtualFieldTypeMap;

var notReady = true;
var notReadyQuque = [];

function CustomTypes() {
    fieldTypeMap = {};
    registeredFieldTypeMap = {};
    registeredVirtualFieldTypeMap = {};
}

CustomTypes.prototype.init = function () {
    /**
     * Builds a map for types, now only KeyStone types.
     * Later TODO: add custom types when keystone supports it.
     */

    _.forEach(Types, function(v, k) {
        fieldTypeMap[v.name] = new CustomTypeHandler(v);
    });

    notReady = false;

    rs.events.fire(rs.enums.EVENTS.REGISTER_CUSTOM_TYPES, this.registerCustomType);

    while(notReadyQuque.length > 0) {
        this.registerCustomType(notReadyQuque.pop());
    }
}


/**
 * Register a new virtual type handler.
 * Virtual type handlers are used for a more fine-detailed column handling.
 * They are set per model/column and not per type.
 * @param {BaseTypeHandler} customHandler
 */
function registerVirtualCustomType (typeHandler) {
    var ksTypeName = typeHandler.ksTypeName || undefined;

    if (! ksTypeName) {
        utils.stdOutAndKill('\nInvalid CutomTypeHandler defined:\n' +'Invalid type handler defined, please check ksTypeName.\n');
    }

    if (! typeHandler.handlers || ! "object" === typeof typeHandler.handlers) {
        utils.stdOutAndKill('\nInvalid CutomTypeHandler defined:\n' + ksTypeName + '.handlers is not defined.\n');
    }

    registeredVirtualFieldTypeMap[typeHandler.ksTypeName] = typeHandler.handlers;
};

/**
 * Register a new type handler.
 * @param {BaseTypeHandler} customHandler
 */
CustomTypes.prototype.registerCustomType = function(typeHandler) {
    if (notReady) {
        notReadyQuque.push(typeHandler);
        return;
    }

    if ("function" === typeof typeHandler.handlers) typeHandler.handlers = { default: typeHandler.handlers };

    if (typeHandler.isVirtual && typeHandler.isVirtual === true) {
        return registerVirtualCustomType(typeHandler);
    }

    var ksTypeName = (typeHandler.ksType && typeHandler.ksType.name) ? typeHandler.ksType.name : typeHandler.ksTypeName || undefined;

    if (! ksTypeName) {
        utils.stdOutAndKill('\nInvalid CutomTypeHandler defined:\n' +'Invalid type handler defined, please check ksTypeName or ksType properties.\n');
    }

    var customHandler = fieldTypeMap[ksTypeName] || undefined;
    if (! customHandler){
        utils.stdOutAndKill('\nInvalid CutomTypeHandler defined:\n' + ksTypeName + ' is not a known Type.\n');
    }

    if (! typeHandler.handlers || ! "object" === typeof typeHandler.handlers) {
        utils.stdOutAndKill('\nInvalid CutomTypeHandler defined:\n' + ksTypeName + '.handlers is not defined.\n');
    }

    customHandler.handler = typeHandler;
    registeredFieldTypeMap[ksTypeName] = customHandler;
};


CustomTypes.prototype.applyCustomTypes = function(req, instance) {
    // req.list.restMetadata.fieldsByTypes is object that represents all the fields in the List, grouped by type.
    // Key: field types (Field.Type)
    // Value: Array of fields with the same type (key)

    for(var key in registeredVirtualFieldTypeMap) {
        if (registeredVirtualFieldTypeMap.hasOwnProperty(key) && req.restApi.restMeta.fieldsByVirtualTypes.hasOwnProperty(key)) {
            var fn = profiles.searchProfile(req.restApi.profile, registeredVirtualFieldTypeMap[key]);
            for (var i=0; i<req.restApi.restMeta.fieldsByVirtualTypes[key].length; i++) {
                var name = req.restApi.restMeta.fieldsByVirtualTypes[key][i];
                if (fn) {
                    instance[name] = fn(instance[name]);
                }
                else {
                    delete instance[name];
                }
            }
        }
    }

    for(var key in registeredFieldTypeMap) {
        if (registeredFieldTypeMap.hasOwnProperty(key) && req.list.restMetadata.fieldsByTypes.hasOwnProperty(key)) {
            var fn = profiles.searchProfile(req.restApi.profile, registeredFieldTypeMap[key].handler.handlers);
            for (var i=0; i<req.list.restMetadata.fieldsByTypes[key].length; i++) {
                var name = req.list.restMetadata.fieldsByTypes[key][i].path;
                if (fn) {
                    instance[name] = fn(instance[name]);
                }
                else {
                    delete instance[name];
                }
            }
        }
    }
    return instance;
}


module.exports = new CustomTypes();
