var rs = require('../RestyStone'),
    profiles = require("./../core/profiles"),
    Response = require("./../models/ResponseContainer"),
    ApiException = require("./../models/ApiException");

function restAuthLogin(req, res) {
    if (req.method === 'POST') { // double check

        var onSuccess = function (token) {
            var output = new Response(true);
            output.result = token;
            res.apiResponse(output);
        };

        var onFail = function (err) {
            console.log(err);
            res.apiError(new ApiException(401, true, "Sorry, that email and password combo are not valid."));
        };

        rs.keystone.session.signin(req.body, req, res, onSuccess, onFail);
    }
    else {
        res.apiError(ApiException.methodNotAllowed());
    }
}

function restAuthLogout(req, res) {
    if (req.method === 'POST') { // double check
        if (req.user) {
            function _next(err) {
                if (err) {
                    res.apiError(new ApiException(401, true, "Sorry, that email and password combo are not valid."), new Response(false));
                }
                else {
                    var output = new Response(true);
                    output.result = true;
                    res.apiResponse(output);
                }
            }
            rs.keystone.session.signout(req, res, _next);
        }
        else {
            res.apiError(ApiException.unauthorized());
        }
    }
    else {
        res.apiError(ApiException.methodNotAllowed());
    }
}


function restHeartbeat(req, res) {
    var profile = profiles.detectProfile(req.user);
    var output = new Response(true);
    output.result = profile.name;
    res.apiResponse(output);
}

module.exports.login = restAuthLogin;
module.exports.logout = restAuthLogout;
module.exports.heartbeat = restHeartbeat;