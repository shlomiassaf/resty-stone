function ApiException(statusCode, isFatal, message, id) {
    this.name = "ApiException";
    this.statusCode = statusCode;
    this.fatal = isFatal;
    this.message = message;
    if(id){
        this.id = id;
    }

}

ApiException.notFound = function() {
    return new ApiException(404 , true, "Not Found" , 404);
}

ApiException.unauthorized = function() {
    return new ApiException(401 , true, "Unauthorized" , 401);
}

ApiException.methodNotAllowed = function() {
    return new ApiException(405 , true, "Method Not Allowed" , 405);
}

ApiException.dbOperationFailed = function(operation, objectName, err) {
    return new ApiException(500, true, "Error performing " + operation + " on " + objectName + ": " + err.message, 2000);
}

ApiException.itemNotExist = function(id, list) {
    var msg;
    if (id && list) msg = id + " does not exist in " + list.singular;
    else if (id) msg = id + " does not exist";
    else if (list) msg = "Value does not exist in " + list.singular;
    else msg = "Item does not exist.";

    return new ApiException(400, true, msg, 1000);
}
module.exports = ApiException