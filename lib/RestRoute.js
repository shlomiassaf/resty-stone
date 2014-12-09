var keystone = require('keystone'),
    settings = require("./settings"),
    RestListMiddlewareFactory = require("./middleware/RestListMiddlewareFactory"),
    inject_rest_support = require("./middleware/restSupport"),
    RestListMetadata = require("./RestListMetadata"),
    restAuth = require("./middleware/restAuth"),
    utils = require("./utils"),
    _ = require('underscore');


function RestRoute() {
    var routeMap = {};
    var restMeta = {};

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
        restMeta = utils.import_modules(modulePath);
        routeMap = {};
        for (var path in keystone.paths) {
            var model = keystone.list(keystone.paths[path]);
            var modelMeta = restMeta[model.key] || undefined;
            if (modelMeta) {
                model.restMetadata = new RestListMetadata(model, modelMeta);
                routeMap[path] = model;
            }
        }
    }

    this.registerRoutes = function(app) {
        app.all(settings.restBasePath + '*', inject_rest_support);

        app.post(settings.restBasePath + "/auth/login", restAuth.login);
        app.post(settings.restBasePath + "/auth/logout", restAuth.logout);

        for (var path in routeMap) {
            app.all(settings.restBasePath + "/" + path + "/:id?", new RestListMiddlewareFactory(routeMap[path]));
        }

        app.all(settings.restBasePath + '*', new RestListMiddlewareFactory(404));
    }

}


module.exports = new RestRoute();