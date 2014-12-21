var rs = require('./RestyStone'),
    ksSession = rs.keystone.session,
    jwt = require('json-web-token'),
    basicAuth = require('basic-auth');


/**
 * A Session manager that decorates KeystoneJS session manager.
 * The decoration is done in 2 ways:
 * 1) Decorating pure functions.
 * 2) Decorating a KeystoneJS settings value.
 * @constructor
 */
function RestySession(originalSession) {

    // tell the cookie decorator to do his thing.
    this.disableCookies = true;

    this.signin = function signin(lookup, req, res, onSuccess, onFail) {
        if (! req.isResty) {
            return originalSession.signin.apply(this, arguments);
        }
        else {
            var User = rs.keystone.list(rs.keystone.get('user model'));

            var doSignin = function(user) {
                req.session.regenerate(function() {
//                    req.user = user;
                    req.session.userId = user.id;

                    var secret = rs.keystone.get('cookie secret');
                    var payload = {
                        'keystone.sid': req.sessionID
                    };

                    jwt.encode(secret, payload, function (err, token) {
                        if (err) {
                            onFail(err);
                        } else {
                            onSuccess(token);
                        }
                    });
                });
            };

            var user = basicAuth(req);
            if (user) {
                lookup.email = user.name;
                lookup.password = user.pass;
            }

            if('string' === typeof lookup.email && 'string' === typeof lookup.password) {
                // match email address and password
                User.model.findOne({ email: lookup.email }).exec(function(err, user) {
                    if (user) {
                        user._.password.compare(lookup.password, function(err, isMatch) {
                            if (!err && isMatch) {
                                doSignin(user);
                            }
                            else {
                                onFail(err);
                            }
                        });
                    } else {
                        onFail(err);
                    }
                });
            }
            else {
                return onFail(new Error('session.signin requires a User ID or Object as the first argument'));
            }
        }
    };

    this.signout = function signout(req, res, next) {
        if (! req.isResty) {
            return originalSession.signout.apply(this, arguments);
        }
        else {
            if (req.user) {
                req.user = null;
                delete req.session.userId;
                req.session.regenerate(next);
            }
            else {
                next(err)
            }
        }
    };

    this.persist = function persist(req, res, next) {
        return originalSession.persist.apply(this, arguments);
//        if (! req.isResty) {
//             return originalSession.persist.apply(this, arguments);
//        }
//        else {
//            next();
//        }
    };

    this.keystoneAuth = function keystoneAuth(req, res, next) {
        if (! req.isResty) {
            return originalSession.keystoneAuth.apply(this, arguments);
        }
        else {
            next();
        }
    };
}

RestySession.factory = function() {
    var authType = rs.keystone.get('resty auth type');
    if (! authType) {
        throw new Error("resty-stone setting 'resty auth type' not defined.");
    }
    else if (authType === 1) { // session
        return ksSession;
    }

//    if (rs.keystone.get('session') === true) {
//        originalSelectedPersist = rs.keystone.session.persist;
//    } else if ('function' === typeof rs.keystone.get('session')) {
//        originalSelectedPersist = rs.keystone.get('session');
//    }



    var session = new RestySession(ksSession);
    switch (authType) {
        case 2: // token
            break;
    }

    return session;
};


module.exports = RestySession;
