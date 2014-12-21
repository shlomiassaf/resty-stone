var profiles = require("../core/profiles"),
    Response = require("../models/ResponseContainer"),
    ApiException = require("../models/ApiException"),
    customTypes = require('../core/customTypes'),
    utils = require("../utils"),
    _ = require('underscore');


function RestListMiddlewareFactory(list) {
    if (list === 404) {
        return RestListMiddlewareFactory.rest_404_middleware;
    }

    var restApi = {
        list: list
    }

    return list_middleware.bind(restApi);
}


RestListMiddlewareFactory.rest_404_middleware = function(req, res) {
    res.apiError(ApiException.notFound());
}


function list_middleware(req, res) {

    req.list = this.list;
    var profile = profiles.detectProfile(req.user);

    req.restApi = {
        profile: profile,
        restMeta: profiles.searchProfile(profile, this.list.restMetadata.pool),
        isGroup:  (req.params.id) ? false : true
    };

    if (req.restApi.restMeta === undefined) {
        return res.apiError(ApiException.unauthorized());
    }

    // now select the right middleware for the job:

    var method = req.method.toLowerCase();
    var allowedMethods = (req.restApi.isGroup) ? req.restApi.restMeta.httpGroupMethods : req.restApi.restMeta.httpMethods;

    // 1. check that we can access using the current http method.
    if (! allowedMethods.hasOwnProperty(method) ) {
        method = 'notAllowed';
    }
    // 2. check if we have an rpc call.
    else if (req.query.action) {
        method = (! utils.is_private_func(req.query.action)) ? req.query.action : 'notAllowed';
    }
    // 3. check if we are addressing a specific id but rest model does`nt allow it.
    else if (! req.restApi.isGroup && req.restApi.restMeta.defaultKey === false) {
        method = 'notAllowed';
    }
    var fn = req.restApi.restMeta.RestList[method] || req.restApi.restMeta.RestList['notAllowed'];

    fn.call(req.restApi.restMeta.RestList, req, function(err, output, needMapping) {
        if (err) {
            res.apiError(err);
        }
        else {
            if (needMapping) {
                if (output.resultType == output.RESULT_TYPE.ARRAY) {
                    output.result = _.map(output.result, function(item) {
                        return customTypes.applyCustomTypes(req, req.restApi.restMeta.RestList._render(req, item.toObject()));
                    });
                }
                else {
                    output.result = customTypes.applyCustomTypes(req, req.restApi.restMeta.RestList._render(req, output.result.toObject()));
                }
            }
            res.apiResponse(output);
        }
    });
}
module.exports = RestListMiddlewareFactory;