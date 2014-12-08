var _ = require('underscore');

function ResponseContainer(success) {
    this.result;
    this.success = (success === true) ? true : false;
    this.resultType = ResponseContainer.prototype.RESULT_TYPE.NOT_SET;
    this.modelType = ResponseContainer.prototype.RESULT_TYPE.NOT_SET;
}

ResponseContainer.prototype.setError = function(err) {
    this.error = err;
}

ResponseContainer.prototype.RESULT_TYPE = {
    'NUMBER': "number",
    'STRING': "string",
    'ARRAY': "array",
    'OBJECT': "object",
    'RESOURCE_LINK': "resourceLink",
    'NOT_SET': "notSet"
}

ResponseContainer.linkSuccess = function(id, url) {
    var result =  new ResponseContainer(true);
    result.resultType = ResponseContainer.prototype.RESULT_TYPE.RESOURCE_LINK;
    result.result = {
        "id": id,
        "url": url
    };
    return result;
}


ResponseContainer.scalarSuccess = function(value) {
    var r =  new ResponseContainer(true);
    r.result = value;
    return r;
}

ResponseContainer.emptySuccess = function() {
    return new ResponseContainer(true);
}

/**
 * Creates a response container from a database query.
 * @param list the list class. set undefined if not representing a defined list.
 * @param result
 */
ResponseContainer.fromQueryResult = function(list, result) {
    var output = new ResponseContainer(true);

    if (list) {
        output.modelType = list.key;
    }

    output.resultType = (_.isArray(result)) ? output.RESULT_TYPE.ARRAY : output.RESULT_TYPE.OBJECT;
    output.result = result;

    return output;
}

/**
 * Creates a response container from a database query with pagination.
 * @param list the list class. set undefined if not representing a defined list.
 * @param result
 */
ResponseContainer.fromPaginatedQueryResult = function(list, result) {
    var output = new ResponseContainer(true);

    if (list) {
        output.modelType = list.key;
    }

    output.resultType = output.RESULT_TYPE.ARRAY;
    output.result = result.results;
    output.pagination = result;
    delete output.pagination.results;

    return output;
}
module.exports = ResponseContainer;