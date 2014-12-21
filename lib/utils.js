var fs = require("fs"),
    path = require("path"),
    ndUrl = require("url"),
    rs = require('./RestyStone'),
    settings = require("./settings"),
    _ = require("underscore");



var utils = {};

/**
 * Loads modules from a directory relative to project root.
 * To load from an absolute directory set isAbsolute to ture
 * @param dirPath
 * @param isAbsolute
 * @returns {{}}
 */
utils.import_modules = function import_modules(dirPath, isAbsolute) {
    var imported = {};
    if (isAbsolute === true) {
        fs.readdirSync(dirPath).forEach(function(name) {
            var fsPath = path.join(dirPath, name),
                info = fs.statSync(fsPath);

            // recur
            if (info.isDirectory()) {
                imported[name] = import_modules(fsPath, true);
            } else {
                // only import files that we can `require`
                var ext  = path.extname(name);
                var base = path.basename(name, ext);
                if (require.extensions[ext]) {
                    imported[base] = require(fsPath);
                }
            }

        });
        return imported;
    }
    else {
        return rs.keystone.import(dirPath);
    }

}

/**
 * Converts an array to hash.
 * @param arr
 * @param defaultVal
 * @returns Array
 */
utils.array_to_hash = function array_to_hash(arr, defaultVal) {
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
utils.string_to_hash = function string_to_hash(str, delimiter, defaultVal) {
    return utils.array_to_hash(str.split(delimiter), defaultVal);
}

/**
 * Filter selected columns from all an object of column name (key) & column objects (value).
 * Works on a set of column Objects from restMeta.
 */
utils.parse_querystring_columns = function parse_querystring_columns(columns_string, columnsMap){
    var columns = _.values(
        (columns_string) ? _.pick(columnsMap, columns_string.split(",")) : columnsMap);

    // if req.query.cols and the restMeta.columns.visible result in an empty group, we need to reset since empty
    // group means ALL column in the table.
    if (columns.length == 0) {
        columns = _.values(columnsMap);
    }

    return columns;
}

utils.deprecated = function deprecated(msg) {
    console.warn("resty-stone WARNING: " + msg);
}

/**
 * Parses a FILTER command from a query string.
 * @param req
 * @returns {*}
 */
utils.parse_querystring_filters = function parse_querystring_filters(req){
    var filters = req.list.processFilters(req.query.q);
    if (req.restApi.restMeta.permanentFilter) {
        _.extend(filters, req.restApi.restMeta.permanentFilter);
    }
    return req.list.getSearchFilters(req.query.search, filters);
}

/**
 * Parses a SORT command from a query string.
 * @param req
 * @returns {*}
 */
utils.parse_querystring_sort = function parse_querystring_sort(req){
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

/**
 * returns a URL for a resource.
 * TODO: Needs modification, this is not a prod ready logic.
 * @param list
 * @param id
 * @param req
 * @returns {string|*|Object|ServerResponse}
 */
utils.get_resource_url = function get_resource_url(list, id, req){
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
utils.is_private_func = function is_private_func(funcName){
    return funcName.substring(0,1) == "_";
}

// This regex detects the arguments portion of a function definition
// Thanks to Angular for the regex
utils.get_func_params = function get_func_params(fn) {
    // Detect the dependencies using the regex
    return fn.toString().match(utils.get_func_params.FN_ARGS)[1].split(',').map(function(i) { return i.trim(); });
}
utils.get_func_params.FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;

/**
 * Escape user input to be treated as a literal string within a regular expression
 * https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Parentheses
 * @param string
 * @returns string
 */
utils.escapeRegExp = function escapeRegExp(string){
    return string.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
}

/**
 * Sends a msg to STDxxx and exit the process.
 * For *nix systems, acts normally. For win systems does a workaround to avoid the non blocking win STDOUT.
 * @param msg
 */
utils.stdOutAndKill = function stdOutAndKill(msg){
    if (utils.stdOutAndKill.isWinRegex.test(process.platform)) {
        /**
         * For windows, since std*** is not blocking.
         * Don`t know what is better, timeout or exception?
         */

//      throw new Error(msg);

        console.error(msg);
        var t = true;
        setTimeout(function() { t = false; }, 50);
        while (t) {}

        process.exit(1);
    }
    else {
        console.error(msg);
        process.exit(1);
    }
}
utils.stdOutAndKill.isWinRegex = /^win/;

/**
 * Parse a list of columns against a List schema.
 * Returns an object containing the 'columns', and 'missingColumns'.
 * @param {Array} columns
 * @param {List} list
 * @param {bool} lazyPath True will include deep paths (1st level)
 */
utils.parseColumnList = function parseColumnList(columns, list, lazyPath)  {
    var keys = Object.getOwnPropertyNames(list.schema.paths);
    var output = _.compact(columns);

    var missingColumns = _.difference(output, keys);

    if (missingColumns.length > 0 && lazyPath) {
        var multiPath = {};

        // group by fist element in path.
        _.each(keys, function(key){
            if (key.indexOf(".") > 0) {
                var path1 = key.substring(0, key.indexOf("."));
                if (! multiPath[path1]) multiPath[path1] = [];
                multiPath[path1].push(key);
            }
        });

        var len = missingColumns.length-1;
        while(len-- > -1){
            var key = missingColumns.shift();
            if (multiPath.hasOwnProperty(key)) {
                _.each(multiPath[key], function(newKey) {output.push(newKey)});
            }
            else {
                missingColumns.push(key)
            }
        }
    }

    return {
        columns: output,
        missingColumns: missingColumns
    }
}

module.exports = utils;
