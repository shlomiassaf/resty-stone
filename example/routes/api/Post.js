var keystone = require('keystone'),
    Post = keystone.list('Post')

module.exports.default = {
    /*
        A comma delimited list of allowed http methods for this list.
        Defaults to empty list.
     */
    "httpMethods": "get",

    /*
     A comma delimited list of allowed http methods for this list that acts on a group.
     A group is an action taken on a list of List (e.g: not accessing a direct instance via defaultKey)
     Set true to inherit from httpMethods.
     WARNING: It is recommended to set this value explicitly (e.g: don`t set true) to prevent catastrophic results.
     For protection, setting httpGroupMethods: TRUE will not drill down to inheriting profiles, the inherited value will be the
     actual httpMethods value of the parent profile and not a reflection of httpMethods of the child profile.

     Defaults to empty list.
     */
    "httpGroupMethods": "get",

    /*
        defaultKey: The column used to search a single list instance with. (e.g: hello-world in www.site.com/api/post/hello-world)
        If not set defaults to the value of list.autokey.path, if list does`nt contain an autokey then _id is taken.
        To disable single item access, set to false.
     */
    "defaultKey": "slug",

    /*
        A filter that acts as a safe-guard to all user queries, except direct id queries (using defaultKey).
        This filter is added to each query. If keys in permanentFilter exist in a query, permanentFilter will override them.
        Example: To return only 'published' posts for GET requests set:  'state:published'
        The filter is declared using KeystoneJS 'queryfilter' library/ see: https://github.com/keystonejs/queryfilter

        Defaults to undefined
     */
    "permanentFilter": "state:published",

    "columns": {
        "visible": [
            "title",
            "publishedDate",
            "slug",
            "author",
            "content:postContent", // see customTypeHandlers.postContent
            "categories",
            "tags"
        ],
        "no_filter": [
            "state",
            "slug",
            "_id"
        ],

        // enable custom population (either a single string/object or an array of string/object)
        // SEE http://mongoosejs.com/docs/populate.html
        "popuplate": [
            {
                path: 'categories',
                select: 'name -id'
            }
        ]
    }
}

module.exports.authorized = {
    "__extends__": "default",
    "httpMethods": "get,put",
    "columns": {
        "visible": [
            "title",
            "publishedDate",
            "slug",
            "author",
            "content.brief", // this time we only show the brief
            "categories",
            "tags"
        ],
        "no_filter": [
            "state",
            "slug",
            "_id"
        ]
    }

};

module.exports.admin = {
    "__extends__": "default",

    "httpMethods": "get,post,put,delete",
    httpGroupMethods: "get,post,put,delete",
    "permanentFilter": undefined,
    "columns": {
        "visible": [
            "title",
            "publishedDate",
            "slug",
            "author",
            "content", // this time we show the original value.
            "categories",
            "tags"
        ],
        "no_filter": [
            "state",
            "slug",
            "_id"
        ]
    }
}