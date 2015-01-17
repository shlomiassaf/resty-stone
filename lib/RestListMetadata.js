var _ = require("underscore"),
    RestList = require("./RestList"),
    RestListMetadataError = require("./models/RestListMetadataError"),
    utils = require("./utils");

// the base implementation has no instance function/behavior.
// this is actually a singleton to handle all requests for a list.
// if not overridden.
var defaultRestList = new RestList();

/**
 * Represents metadata about a list object in the rest domain.
 * This class "compiles" a list metadata module into a single object and supports profile selection. (e.g: admin..)
 * @param list
 * @param listMeta
 * @constructor
 */
function RestListMetadata(list, listMeta) {
    var pool = {};

    var profiles = Object.getOwnPropertyNames(listMeta);
    while (profiles.length) {
        var p = profiles.shift();

        if (p == "isAdmin") {
            utils.deprecated("Profile 'isAdmin' is deprecated, please use 'admin' instead. Admin access to resource " + list.key + " is disabled.");
        }
        var meta = listMeta[p];
        var metaBase;

        // check for circular inheritance or non-existing.
        if (meta.hasOwnProperty('__extends__')) {
            var metaBaseName = meta["__extends__"];
            if (! pool.hasOwnProperty(metaBaseName)) {
                if (listMeta.hasOwnProperty(metaBaseName)) {
                    var checkCircular = listMeta[metaBaseName]['__extends__'] || undefined;
                    if (checkCircular == p) {
                        throw new Error("Circular inheritance for RestListMetadata profiles " + p + " & " + metaBaseName + " in Model " + list.key + ".")
                    }
                    profiles.push(p);
                    continue;
                }
                else {
                    throw new Error("RestListMetadata profile " + p + " extends a non-existing profile " + metaBaseName + " in Model " + list.key + ".")
                }
            }
            // were ok, set inheritance.
            delete meta["__extends__"];
            metaBase =  _.extend({}, pool[metaBaseName]);
        }
        pool[p] = compile_meta_module(list, meta, metaBase || defaultConfig(list))

    }

    this.fieldsByTypes = groupFieldsByType(list);
    this.pool = pool;
};

/**
 * All fields grouped by Field.type
 * @type {{}}
 */
RestListMetadata.prototype.fieldsByTypes = undefined;
/**
 * Profiles for the resource.
 * @type {undefined}
 */
RestListMetadata.prototype.pool = undefined;


/**
 * Groups all fields in a list by type.
 * @param list
 * @returns {{}} An object map of type/fields.
 */
function groupFieldsByType(list){
    var fields = {};
    _.each(list.fields, function(v,k) {
        if (! fields.hasOwnProperty(v.type)) fields[v.type] = [];
        fields[v.type].push(v);
    });
    return fields;
}

function defaultConfig(list) {
    return {
        defaultKey: (list.autokey && list.autokey.path) ? list.autokey.path : '_id',
        httpMethods: "",
        httpGroupMethods: "",
        RestList: defaultRestList,
        permanentFilter: undefined,
        columns: {
            no_filter: [],
            visible: []
        }
    }
};

function compile_meta_module(list, listMeta, base) {
    var meta = _.extend(base || {}, listMeta);
    validate_meta_profile_pre(list, meta);

    // build http method obj
    if (typeof meta.httpMethods === "string") {
        meta.httpMethods  = utils.string_to_hash(meta.httpMethods, ",", true);
    }

    // build http group method obj
    if (meta.httpGroupMethods === true) {
        meta.httpGroupMethods = meta.httpMethods;
    }
    if (typeof meta.httpGroupMethods === "string") {
        meta.httpGroupMethods = utils.string_to_hash(meta.httpGroupMethods, ",", true);
    }

    if (! meta.popuplate) {
        meta.popuplate = [];
    }
    else if (!_.isArray(meta.popuplate)) {
        meta.popuplate = [meta.popuplate];
    }


    // build visible column objects.
    //TODO: create 1 pool for all column objects and set each profile column by reference...
    // or just make sure they are the same object at each profile.
    if (_.isArray(meta.columns.visible)) {
        // check for : in columns, if found, add a virtual custom type. anyway add to visible for later use.
        var visible = [];
        meta.fieldsByVirtualTypes = {};
        _.each(meta.columns.visible, function(v){
            var arr = v.split(":");
            if (arr.length>1) {
                if (! meta.fieldsByVirtualTypes[arr[1]]) meta.fieldsByVirtualTypes[arr[1]] = [];
                meta.fieldsByVirtualTypes[arr[1]].push(arr[0]);
            }
            visible.push(arr[0]);
        });

        var parsed = utils.parseColumnList(visible, list, true);

        var colObjects = {};
        var cols = parsed.columns.join(",");
        _.forEach(list.expandColumns(cols), function(value) {
            colObjects[value.path] = value;
        });
        meta.columns.visible = colObjects
    }



    // build permanent filters
    if (meta.permanentFilter && typeof meta.permanentFilter == "string") {
        meta.permanentFilter = list.processFilters(meta.permanentFilter);
    }

    validate_meta_profile_post(list, meta);
    return meta;
}


function validate_meta_profile_pre(list, meta) {
//    if (_.isArray(meta.columns.visible)) {
//        var parsed = utils.parseColumnList(meta.columns.visible, list, true);
//
//        if (parsed.missingColumns.length > 0) {
//            throw new RestListMetadataError(list, "Invalid visible columns defined - [" + parsed.missingColumns.join("],[") + "]");
//        }
//    }

    if (_.isArray(meta.columns.no_filter)) {
        var missingColumns = _.difference(meta.columns.no_filter, Object.getOwnPropertyNames(list.schema.paths));
        if (missingColumns.length > 0) {
            throw new RestListMetadataError(list, "Invalid no_filter columns defined - [" + missingColumns.join("],[") + "]");
        }
    }
}


function validate_meta_profile_post(list, meta) {
    // check that we can query by defaultKey, unless its false (deliberate)
    if (! meta.defaultKey === false && ! list.schema.paths[meta.defaultKey]){
        throw new RestListMetadataError(list, "Could not find defaultKey '" + meta.defaultKey);
    }

    // check that permanentFilter refer to existing columns. the test is done over column object, not the string.
    if (meta.permanentFilter) {
        var missingColumns = _.filter(meta.permanentFilter, _.matches({field: undefined}));
        if (missingColumns.length > 0) {
            throw new RestListMetadataError(list, "Invalid permanentFilter columns defined - [" + missingColumns.join("],[") + "]");
        }
    }

    var funcErrors = [];
    _.forEach(["get", "post", "put", "delete", "notAllowed"], function(v, k) {
        if (! meta.RestList[v]) {
            return;
        }

        k = v;
        v = meta.RestList[k];
        if (! utils.is_private_func(k)){
            if (! _.isFunction(v)) {
                funcErrors.push('property ' + k + " is not a function");
            }
            else {
                var params = utils.get_func_params(v);
                if (params.length != 2) {
                    funcErrors.push('function ' + k + " has invalid Signature");
                }
                else if (params[1] == "res") {
                    funcErrors.push('function ' + k + " 2nd parameter shoud be a callback function, not a response object.");
                }
            }
        }
    });
    if (funcErrors.length > 0) {
        throw new RestListMetadataError(list, "Invalid RestList Implementation:\n" + funcErrors.join("\n"));
    }


    if (! meta.RestList.notAllowed) {
        throw new RestListMetadataError(list, "Invalid RestList Implementation: missing nowAllowed function.");
    }

    if (! meta.RestList._render || !_.isFunction(meta.RestList._render) ) {
        throw new RestListMetadataError(list, "Invalid RestList Implementation: missing or invalid _render function.");
    }
}


module.exports = RestListMetadata;
