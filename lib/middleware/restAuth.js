var keystone = require("keystone"),
    Response = require("./../models/ResponseContainer"),
    ApiException = require("./../models/ApiException");

function restAuthLogin(req, res) {
    if (req.method === 'POST') { // double check

        if (!req.body.email || !req.body.password) {
            res.apiError(new ApiException(400, true, "Please enter your email address and password."), new Response(false));
            return;
        }

        var onSuccess = function (user) {
            var output = new Response(true);
            output.result = true; //todo: add api token.
            res.apiResponse(output);
        };

        var onFail = function () {
            res.apiError(new ApiException(401, true, "Sorry, that email and password combo are not valid."), new Response(false));
        };

        keystone.session.signin(req.body, req, res, onSuccess, onFail);
    }
}

function restAuthLogout(req, res) {
    res.clearCookie('keystone.uid');
    req.user = null;

    req.session.regenerate(function(err) {
        var output = new Response(true);
        output.result = true; //todo: add api token.
        res.apiResponse(output);
    });
}

module.exports.login = restAuthLogin;
module.exports.logout = restAuthLogout;