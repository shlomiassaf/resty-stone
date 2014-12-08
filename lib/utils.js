var fs = require("fs"),
    path = require("path"),
    ndUrl = require("url"),
    keystone = require("keystone"),
    settings = require("./settings"),
    _ = require("underscore");



/**
 * Loads modules from a directory relative to root.
 * @param relativeDir
 * @returns {{}}
 */
function import_modules(relativeDir) {
    return keystone.import(relativeDir);
}

/**
 * Converts an array to hash.
 * @param arr
 * @param defaultVal
 * @returns Array
 */
function array_to_hash(arr, defaultVal) {
    var result = {};
    var tmp;
    for (var i=0; i < arr.length; i++) {
        tmp = arr[i].trim();
        if (tmp.length > 0) {
            result[tmp] = defaultVal;
        }
    }
    return result;
}

/**
 * Converts a string to hash using a delimiter.
 * @param str
 * @param delimiter
 * @param defaultValue
 * @returns Array
 */
function string_to_hash(str, delimiter, defaultVal) {
    return array_to_hash(str.split(delimiter), defaultVal);
}

/**
 * Filter selected columns from all an object of column name (key) & column objects (value).
 * Works on a set of column Objects from restMeta.
 */
function parse_querystring_columns(columns_string, columnsMap){
    var columns = _.values(
        (columns_string) ? _.pick(columnsMap, columns_string.split(",")) : columnsMap);

    // if req.query.cols and the restMeta.columns.visible result in an empty group, we need to reset since empty
    // group means ALL column in the table.
    if (columns.length == 0) {
        columns = _.values(columnsMap);
    }

    return columns;
}

function parse_querystring_filters(req){
    var filters = req.list.processFilters(req.query.q);
    if (req.restApi.restMeta.permanentFilter) {
        _.extend(filters, req.restApi.restMeta.permanentFilter);
    }
    return req.list.getSearchFilters(req.query.search, filters);
}

function parse_querystring_sort(req){
    var sort = { by: req.query.sort || req.list.defaultSort };

    if (sort.by) {
        sort.inv = sort.by.charAt(0) === '-';
        sort.path = (sort.inv) ? sort.by.substr(1) : sort.by;
        sort.field = req.list.fields[sort.path];


        // clear the sort query value if it is the default sort value for the list
        if (req.query.sort === req.list.defaultSort) {
            sort.by = undefined;
        }
        else if (sort.field) {
            // the sort is set to a field, use its label
            sort.label = sort.field.label;
            // some fields have custom sort paths
            if (sort.field.type === 'name') {
                sort.by = sort.by + '.first ' + sort.by + '.last';
            }
        } else if (req.list.get('sortable') && (sort.by === 'sortOrder' || sort.by === '-sortOrder')) {
            // the sort is set to the built-in sort order, set the label correctly
            sort.label = 'display order';
        } else if (req.query.sort) {
            sort.by = undefined;
        }
    }

    return sort.by;
}

function get_resource_url(list, id, req){
    return ndUrl.format({
        protocol: req.protocol,
        host: req.headers.host, // TODO: dont relay on headers, get a fixed value.
        pathname: settings.restBasePath + "/" + list.path + '/' + id || ""
    });
}

/**
 * Indicates if a function is private by checking if it starts with a _.
 * @param funcName
 */
function is_private_func(funcName){
    return funcName.substring(0,1) == "_";
}

// This regex detects the arguments portion of a function definition
// Thanks to Angular for the regex
var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
function get_func_params(fn) {
    // Detect the dependencies using the regex
    return fn.toString().match(FN_ARGS)[1].split(',').map(function(i) { return i.trim(); });
}

module.exports.import_modules = import_modules;
module.exports.array_to_hash = array_to_hash;
module.exports.string_to_hash = string_to_hash;
module.exports.parse_querystring_columns = parse_querystring_columns
module.exports.parse_querystring_filters = parse_querystring_filters
module.exports.parse_querystring_sort = parse_querystring_sort
module.exports.get_resource_url = get_resource_url;
module.exports.get_func_params = get_func_params;
module.exports.is_private_func = is_private_func;
