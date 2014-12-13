var router = require("../RestRoute");

function routingDecorator(keystone) {
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

module.exports = {
    event: "resty_onStart",
    decorator: routingDecorator
}