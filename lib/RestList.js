var Response = require("./models/ResponseContainer"),
    ApiException = require("./models/ApiException"),
    utils = require("./utils"),
    _ = require('underscore');


/**
 * Represents a List object in the rest world.
 * RestList is a request handler and a view, it also allows running custom function on an object.
 *
 * Request handler: handling a request per method type.
 * For each http method type you wish to handle, supply a corresponding lower case function (e.g this.get).
 * The function signature must be function (req, cb) where callback is a function to be called when done.
 * cb signature: function(err, output, needMapping). set 'needMapping' to true if you wish to activate "_render()" on each result.
 *
 * Remote procedure call: Custom handling calls beyond the http standard REST calls (get, post, put etc...).
 * To enable a custom function just implement one on the new or inherited object.
 * To call this function remotely add an action key with the function name as a value to the query string.
 * Example, adding a custom call "doCustom" to list object "Post":
 * var l = new RestList();
 * l.doCustom = function(req, cb) { cb(undefined, "I Just did custom." };
 * Make sure to set l as your "RestList" value in Post Rest metadata.
 * Then rest to: www.example.com/api/post?action=doCustom
 * You can even go wild and set different handlers per profile using the differentiated metadata mechanism.
 * WARNING: Make sure not to expose only whats needed on the RestList you implement.
 * Each public function (e.g: available on the prototype route) is subject to remote procedure call, except those starting with _ (e.g: _render())
 *
 *
 *
 * View: Acts as a List to Rest result mapper.
 * The _render() function does not actually renders the result.
 * It acts as an intermediate step that fine-grains each result instance.
 *
 * Inherit this object to override specific http methods while keeping other.
 * to set a method as not supported overwrite it with the not_supported handler.
 * e.g: this.get = this.not_supported;
 * @constructor
 */
function RestList() {
}

/**
 * Returns a an object representing a result instance, to be sent as json
 * @param req
 * @param instance
 */
RestList.prototype._render = function(req, instance) {
    //TODO: this is exposed, need to find a way to hide.
    return instance;
};

RestList.prototype.notAllowed = function(req, cb) {
    cb(ApiException.methodNotAllowed(), undefined);
};

RestList.prototype.get = function(req, cb) {


    if (! req.restApi.isGroup) {
        //TODO: support nested relationships.

        // if deliberetly set to false, return not supported.
        if (req.restApi.restMeta.defaultKey === false) {
            return this.notAllowed(req, cb);
        }
        else {
            var q = req.list.model
                .findOne()
                .where(req.restApi.restMeta.defaultKey)
                .equals(req.params.id);

            req.list.selectColumns(q,  _.values(req.restApi.restMeta.columns.visible));

            for (var i=0; i< req.restApi.restMeta.popuplate.length; i++) {
                q = q.populate(req.restApi.restMeta.popuplate[i]);
            }

            q.exec(function (err, item) {
                if (err) {
                    cb(err);
                }
                else {
                    cb(undefined, Response.fromQueryResult(req.list, item), true);
                }
            });
        }
    }
    else {
        var queryFilters = utils.parse_querystring_filters(req);
        var columns = utils.parse_querystring_columns(req.query.cols, req.restApi.restMeta.columns.visible);
        var sortBy = utils.parse_querystring_sort(req);

        var q = req.list.paginate({
            filters: queryFilters,
            page: req.query.page,
            perPage: req.list.get('perPage')
        }).sort(sortBy);

        req.list.selectColumns(q, columns);

        for (var i=0; i< req.restApi.restMeta.popuplate.length; i++) {
            q = q.populate(req.restApi.restMeta.popuplate[i]);
        }

        q.exec(function (err, items) {
            if (err) {
                cb(err);
            }
            else {
                cb(undefined, Response.fromPaginatedQueryResult(req.list, items), true);
            }
        });
    }
};


RestList.prototype.post = function(req, cb) {
    if (req.params.id) {
        cb(new ApiException(400, true, "Post is not allowed on existing items, user PUT."), undefined);
        return;
    }

    //TODO: Add support for nested relationship update using post?

    var item = new req.list.model();
    var updateHandler = item.getUpdateHandler(req);

    if (req.list.nameIsInitial) {
        if (!req.list.nameField.validateInput(req.body, true, item)) {
            updateHandler.addValidationError(req.list.nameField.path, req.list.nameField.label + ' is required.');
        }
        req.list.nameField.updateItem(item, req.body);
    }

    updateHandler.process(req.body, {
        flashErrors: false,
        logErrors: true// , fields: req.list.initialFields
    }, function(err) {
        //console.log(err);
        if (err) {
            cb(ApiException.dbOperationFailed("insert", req.list.singular, err), undefined);
        }
        else {
            var id = item[req.restApi.restMeta.defaultKey || 'id'],
                url = utils.get_resource_url(req.list, id, req);
            cb(undefined, Response.linkSuccess(id, url), false);
        }

    });
};

RestList.prototype.put = function(req, cb) {
    if (req.params.id) {
        req.list.model.findOne()
            .where(req.restApi.restMeta.defaultKey)
            .equals(req.params.id)
            .exec(function (err, item) {
                if (err || !item) {
                    cb(ApiException.itemNotExist(req.params.id, req.list), undefined);
                }
                else {
                    item.getUpdateHandler(req).process(req.body, { flashErrors: false, logErrors: true }, function(err) {
                        if (err) {
                            cb(ApiException.dbOperationFailed("update", req.list.singular, err), undefined);
                        }
                        var id = item[req.restApi.restMeta.defaultKey || 'id'],
                            url = utils.get_resource_url(req.list, id, req);
                        cb(undefined, Response.linkSuccess(id, url), false);
                    });
                }
            });
    }
    else {
        cb(new ApiException(400, true, "Missing Identifier value."), undefined);
    }
};

RestList.prototype.delete = function(req, cb) {
    if (req.params.id) {
        req.list.model.findOne()
            .where(req.restApi.restMeta.defaultKey)
            .equals(req.params.id)
            .exec(function (err, item) {
                if (err || !item) {
                    cb(ApiException.itemNotExist(req.params.id, req.list), undefined);
                }
                else {
                    item.remove(function (err) {
                        if (err) {
                            cb(ApiException.dbOperationFailed("delete", req.list.singular, err), undefined);
                        } else {
                            cb(undefined, Response.emptySuccess(), false);
                        }
                    });
                }
        });
    }
    else {
        cb(new ApiException(400, true, "Missing Identifier value."), undefined);
    }
};

module.exports = RestList;