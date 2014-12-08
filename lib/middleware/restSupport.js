var Response = require("./../models/ResponseContainer"),
    ApiException = require("./../models/ApiException");

function inject_rest_support(req, res, next) {
    res.apiResponse = function(responseContainer) {
        if (req.query.callback)
            res.jsonp(responseContainer);
        else
            res.json(responseContainer);
    };

    res.apiError = function(ex, responseContainer) {
        if (! responseContainer) {
            responseContainer = new Response(false);
        }
        var statusCode = (ex instanceof ApiException) ? ex.statusCode : 500;
        responseContainer.setError(ex.message);
        res.status(statusCode);
        res.apiResponse(responseContainer)
    };
    next();
}

module.exports = inject_rest_support;