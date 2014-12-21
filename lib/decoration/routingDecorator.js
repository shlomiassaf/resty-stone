var rs = require('../RestyStone'),
    router = require("../RestRoute");

function routingDecorator() {
    var originalRoutes = ('function' === typeof rs.keystone.get('routes')) ? rs.keystone.get('routes') : false;
    rs.keystone.set('routes', routesWrapper);

    function routesWrapper(app) {

        if (rs.keystone.get('resty api base address')) {
            router.setBasePath(rs.keystone.get('resty api base address'));
        }

        router.init(rs.keystone.get('resty meta location'));

        if (! originalRoutes == false) {
            originalRoutes(rs.keystone.app);
        }

        router.registerRoutes(app);
    }
};

module.exports = {
    event: "resty_onStart",
    decorator: routingDecorator
}