var keystone = require("keystone"),
    Response = require("./../models/ResponseContainer"),
    ApiException = require("./../models/ApiException"),
    utils = require("../utils");


function restyBaseMiddlewareGenerator() {
    var apiNegateRegex  = new RegExp("^(?!" + utils.escapeRegExp(keystone.get('resty api base address')) +  "(\/.*)?$)");

    function restyBaseMiddleware(req, res, next) {
        if (apiNegateRegex.exec(req.url) == null) {
            req.isResty = true;

            // if were in REST, no cookie are allowed, clear them for security.
            delete req.headers.cookie;
            req.secret = keystone.get('cookie secret');
            req.cookies = {}; //this will make cookieParser to skip, if for any reason it get executed...
            req.signedCookies = {};

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
        }
        next();
    }

    return restyBaseMiddleware;
}

module.exports = restyBaseMiddlewareGenerator;