var keystone = require("keystone"),
    ksSession = keystone.session;

/**
 * A Session manager that decorates KeystoneJS session manager.
 * The decoration is done in 2 ways:
 * 1) Decorating pure functions.
 * 2) Decorating a KeystoneJS settings value.
 * @constructor
 */
function RestySession() {
    var self = this;

    var originals = {
        signin: ksSession.signin,
        signout: ksSession.signin,
        persist: ksSession.persist,
        keystoneAuth: ksSession.keystoneAuth
    };
    var originalSelectedPersist;

    this.signin = function signin(lookup, req, res, onSuccess, onFail) {
        //console.log('ksSession.signin');
        return originals.signin(lookup, req, res, onSuccess, onFail);
    };

    this.signout = function signout(req, res, next) {
        //console.log('ksSession.signout');
        return originals.signout(req, res, next);
    };

    this.persist = function persist(req, res, next) {
        //console.log('ksSession.persist');
        return originals.persist(req, res, next);
    };

    this.keystoneAuth = function keystoneAuth(req, res, next) {
        //console.log('ksSession.keystoneAuth');
        return originals.keystoneAuth(req, res, next);
    };

    this.decorateKeystoneSession = function() {
        if (keystone.get('session') === true) {
            originalSelectedPersist = keystone.session.persist;
        } else if ('function' === typeof keystone.get('session')) {
            originalSelectedPersist = keystone.get('session');
        }

        keystone.set('session', self.persist);
    }
}

module.exports = RestySession;
