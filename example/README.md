This examples use the basic KeystoneJS generator structure configured to support a blog.

Since a blog has a post we will provide REST support for a Post list.

routes->index.js provides an entry point for registering our api.
For REST support we only add the following code:
```javascript
    var r = require("resty-stone");
    //r.router.setBasePath("/myApi//");
    r.router.init("./routes/api"); // init REST, let it know where metadata is.
    r.router.registerRoutes(app);
```

routes->api is a directory holding metadata for List classes we want to provide a REST interface to.
The structure is simple, for each model you want to provide REST interface, make sure to include a metadata module.

routes->api->Post.js is a metadata module providing metadata information per profile. A profile is actually a permission set.
Currently there is no support for profiling in KeystoneJS other the Admin.
Look at the file for documentation.


