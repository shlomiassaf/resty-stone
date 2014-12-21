var rs = require('./RestyStone'),
    settings = require("./settings"),
    RestListMiddlewareFactory = require("./middleware/RestListMiddlewareFactory"),
    RestListMetadata = require("./RestListMetadata"),
    restAuth = require("./middleware/restAuth"),
    utils = require("./utils"),
    _ = require('underscore');

function RestRoute() {
    var routeMap = {};
    var restMeta = {};

    var self = this;

    this.setBasePath = function(p) {
        if (!p) {
            settings.restBasePath = "";
        }
        else {
            while(p.indexOf("/") == 0) {
                p = p.substring(1);
            }
            while(p.lastIndexOf("/") == p.length - 1) {
                p = p.substring(0, p.length -2);
            }
            settings.restBasePath = "/" + p;
        }
    }



    this.init = function(modulePath) {
        restMeta = utils.import_modules(modulePath, false);
        routeMap = {};
        for (var path in rs.keystone.paths) {
            var model = rs.keystone.list(rs.keystone.paths[path]);
            var modelMeta = restMeta[model.key] || undefined;
            if (modelMeta) {
                model.restMetadata = new RestListMetadata(model, modelMeta);
                routeMap[path] = model;
            }
        }
    }

    this.registerRoutes = function(app) {
        rs.events.fire(rs.enums.EVENTS.BEFORE_REGISTER_ROUTES, app);

        app.post(settings.restBasePath + "/auth/login", restAuth.login);
        app.post(settings.restBasePath + "/auth/logout", restAuth.logout);
        app.all(settings.restBasePath + "/auth/heartbeat", restAuth.heartbeat);

        for (var path in routeMap) {
            app.all(settings.restBasePath + "/" + path + "/:id?", new RestListMiddlewareFactory(routeMap[path]));
        }

        app.all(settings.restBasePath + '*', new RestListMiddlewareFactory(404));

        rs.events.fire(rs.enums.EVENTS.AFTER_REGISTER_ROUTES, app);
    }

}


module.exports = new RestRoute();