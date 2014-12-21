var rs = require('../RestyStone'),
    RestySession = require("../RestySession"),
    EventEmitter = require("events").EventEmitter,
    jwt = require('json-web-token');

var originalCookieParserMiddleware;
var originalSessionMiddleware;
var tokenHeaderName;

/**
 * Replaces keystone session API with a proxy to handle authentication different the cookie auth.
 * @param keystone
 */
function sessionDecorator() {
    // save token header to be used in cookieParserDecorator middleware.
    tokenHeaderName = rs.keystone.get('resty token header');

    rs.keystone.session = RestySession.factory(rs.keystone);
    rs.keystone.set('session', rs.keystone.session.persist);
};

/**
 * Replace the default cookie parser with a proxy cookie parser middleware.
 * The proxy is then used to decide what parser is right for the task.
 * If we are not in the api realm, use the default cookie parser.
 * In any other case, use the appropriate one.
 *
 * This approach is used to create fake "cookie" data.
 * By faking cookie data we can use default session middleware as is without the need to replace it.
 * @param req
 * @param res
 * @param next
 */
function cookieParserDecorator(req, res, next) {
    // run express.cookieParser() only when were not visiting the api.

    if (req.isResty) {
        // get token from headers.
        var token = req.headers[tokenHeaderName] || undefined;
        if (token) {
            try {
                // decode token, it holds and create a fake cookie.
                jwt.decode(req.secret, token, function (err, decode) {
                    if (! err) {
                        // set the fake cookie, it will now have a keystone session id
                        req.signedCookies = decode;
                    }
                });
            }
            catch(ex) {
                // when token does not parse to an object.
            }
        }


        var listenersCount = EventEmitter.listenerCount(res, 'header');
        originalSessionMiddleware(req, res, function(){
            if (EventEmitter.listenerCount(res, 'header') > listenersCount) {
                res.removeListener('header', res.listeners('header')[listenersCount]);
            }
            next();
        });

    }
    else {
        // run the original cookie parser.
        originalCookieParserMiddleware(req, res, function() {
            originalSessionMiddleware(req, res, next);
        });
    }
}

function keystoneOnMount(){
    // Replace cookieParser middleware if cookies are disabled.
    // cookies will work but only for non API endpoints.
    // Add a middleware after session middleware to remove cookie insertion on "header" event.
    // TODO:    Change implementation, this is a bad one, tempering with express.app.stack that might change someday.
    //          Need more customization from KeystoneJS, maybe a pull request?
    if (rs.keystone.session.disableCookies === true) {
        var sessionOptions = rs.keystone.get('session options');
        for(var i=0; i < rs.keystone.app.stack.length; i++){
            if (rs.keystone.app.stack[i].handle === sessionOptions.cookieParser) {
                // TODO:    This is true as long as Keystone doesnt change middleware ordering... (cookieParser then Session)
                //          This is a temp solution, need to find something stable.

                originalCookieParserMiddleware = sessionOptions.cookieParser;
                originalSessionMiddleware = rs.keystone.app.stack[i+1].handle

                // TODO: on move to express 4.0 put regex here instead of restBaseMiddlewareGenerator...
                rs.keystone.app.use("/", cookieParserDecorator);
                rs.keystone.app.stack.splice(i, 2, rs.keystone.app.stack.pop()); // remove 2, cookieParser & express.session
            }
        }
    }
}

module.exports = [
    {
        event: "resty_onStart",
        decorator: sessionDecorator
    },
    {
        event: "onMount",
        decorator: keystoneOnMount
    }
]