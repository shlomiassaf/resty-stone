var keystone = require("keystone"),
    router = require("./lib/RestRoute"),
    RestySession = require("./lib/RestySession");

function routingDecorator() {
    var originalRoutes = ('function' === typeof keystone.get('routes')) ? keystone.get('routes') : false;
    keystone.set('routes', routesWrapper);

    function routesWrapper(app) {

        if (keystone.get('resty api base address')) {
            router.setBasePath(keystone.get('resty api base address'));
        }

        router.init(keystone.get('resty meta location'));

        if (! originalRoutes == false) {
            originalRoutes(keystone.app);
        }

        router.registerRoutes(app);
    }
};

module.exports.start = function(events) {
    routingDecorator();
    new RestySession().decorateKeystoneSession();

    return events;
}

module.exports.RestList = require("./lib/RestList");
module.exports.router = router;