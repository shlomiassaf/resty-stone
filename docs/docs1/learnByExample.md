## Background
Learn by example  assume you know nothing about the framework, so here are some basic stuff:

### Resource
A resource is an API endpoint representing a List (Model).  
Each resource exposed must have metadata. It can also have custom behavior, if you supply such.  
 

#### Resource Metadata
Each resource must have data defining its capabilities, constraints and security model in the REST domain.  
The behavior of List models in Admin UI and/or Frontend UI is not similar to the be
In Keystone, a  List models define the database schema for each Model. Views (via jade) define how to display these models  
resty-stone resource is like a view, it is responsible for the display 


### Endpoints
The endpoint structure is: http://__SITE_ADDRESS__/__API_BASENAME__/__RESOURCE__/__RESOURCE_ID__

__API_BASENAME__ is a configurable value, fixed throughout the server lifetime.  
__RESOURCE__ is the resource plural name as defined in mongoDB.  
__RESOURCE_ID__ is a configurable value, set in the metadata for each resource, default to _id.  

Here is an example: `http://localhost:3000/api/testies/test1`

### Requests
There are 2 main request types:  
  - Single item request.  
  - Multiple item request (query).
  
Single item request is a request to a resource using a unique identifier.  
Multiple item request is a request for a resource, not supplying an identifier.

There are also RPC requests on a resource.

### Response
The response is consistent, each call return the same wrapper around the result:

Here is an example for a single item request `http://localhost:3000/api/testies/test1`
```
{
    "success": true,
    "resultType": "object",
    "modelType": "Testy",
    "result": {
        "_id": "549486760ac04c1c184dd188",
        "title": "test1",
        "cimage": "http://res.cloudinary.com/deadeunpn/image/upload/v1419019933/test1.jpg"
    }
}
```

Now, for multiple items: `http://localhost:3000/api/testies/`
```
 {
     "success": true,
     "resultType": "array",
     "modelType": "Testy",
     "result": [
         {
             "_id": "549486760ac04c1c184dd188",
             "title": "test1",
             "cimage": "http://res.cloudinary.com/deadeunpn/image/upload/v1419019933/test1.jpg"
         }
     ],
     "pagination": {
         "total": 1,
         "currentPage": 1,
         "totalPages": 1,
         "pages": [
             1
         ],
         "previous": false,
         "next": false,
         "first": 1,
         "last": 1
     }
 }
```
This time a __pagination__ object is added.

## Querystring (Filter, sort, pagination, etc...)
Supply query string parameters to narrow the results.

### Pagination  
Query string key: __page__  
Example: `http://localhost:3000/api/testies?page=2`  
Get all Testy Resource found on page 2, assuming page 2 exists.

### Filter  
Query string key: __q__  
Example: `http://localhost:3000/api/Post?q=state:published`  
Returns all posts with property state = published.
This is excatly the same to Keystone's implementation, See (queryfilter)[https://github.com/keystonejs/queryfilter] 

### Sort
Query string key: __sort__  
Example: `http://localhost:3000/api/Post?sort=state`  
Returns the result sorted by the specified column name.  
Prefix the column name with - to reverse order. (`sort=-state`)
This is excatly the same to Keystone's implementation.


## Custom Field types
Keystone schema is built from columns, each has a defined Field Type, either native or custom (Text, Html, CloudinaryImage, etc...)  
You can specify how field types get transformed before being sent to the JSON parser.

There are 2 types to register a Custom Type.
1) Registering a GLOBAL custom type for a Keystone Field Type.
2) Registering a VIRTUAL custom type, used on columns when specifically defined (in the metadata).

### GLOBAL custom type handlers:    
The following example demonstrates a CloudinaryImage custom type handler.
It transforms differentially per profile.

```
var enums = require("resty-stone").enums;

/**
 * Handles CloudinaryImage instances for unauthorized requests.
 */
function defaultHandler(value) {
    if (! value) return value;
    return value.url;
}

/**
 * Handles CloudinaryImage instances for authorized requests.
 */
function authorizedHandler(value) {
    if (! value) return value;
    delete value.public_id;
    delete value.version;
    delete value.signature;
    delete value.resource_type;

    return value;
}

/**
 * Handles CloudinaryImage instances for admin requests.
 */
function adminHandler(value) {
    return value;
}

var handlerDefinition = {};
handlerDefinition[enums.SYSTEM_PROFILES.UNAUTHORIZED] = defaultHandler;
handlerDefinition[enums.SYSTEM_PROFILES.AUTHORIZED] = authorizedHandler;
handlerDefinition[enums.SYSTEM_PROFILES.ADMIN] = adminHandler;

module.exports = {
    ksTypeName: "cloudinaryimage",
    ksType: undefined, // set type, if type is not set, takes name
    handlers: handlerDefinition
};
```

You can supply the Field Type as a string or a Field object.  
__ksType__ takes precedence over __ksTypeName__.  
__ksType__ Example: `ksType: keystone.Field.Type.CloudinaryImage`  
__ksTypeName__ is the type name as set in `Field.type`  

UNAUTHORIZED users will get:
```
    ...
    "cimage": "http://res.cloudinary.com/xxxx/image/upload/yasdgf4t43.jpg"
    ...
```

AUTHORIZED users will get:
```
    ...
    "cimage": {
    	width: 640,
    	height: 426,
    	format: "jpg",
    	url: "http://res.cloudinary.com/deadeunpn/image/upload/v1419019933/test1.jpg",
        secure_url: "https://res.cloudinary.com/deadeunpn/image/upload/v1419019933/test1.jpg"
    }
    ...
```

ADMIN users will get:
```
    ...
    "cimage": {
    	public_id: "test1",
   		version: 1419019933,
  		signature: "6d42fdf0319a83fbfbce78a0a1c19219e4acc8a1",
   		width: 640,
   		height: 426,
   		format: "jpg",
   		resource_type: "image",
   		url: "http://res.cloudinary.com/deadeunpn/image/upload/v1419019933/test1.jpg",
   		secure_url: "https://res.cloudinary.com/deadeunpn/image/upload/v1419019933/test1.jpg"
   	}
    ...
```


### VIRTUAL custom type handlers  
Virtual custom type handlers are the same as GLOBAL but they are applied on specific column, specified in the resource metadata.

```
var enums = require("resty-stone").enums;

/**
 * Handles CloudinaryImage instances for unauthorized requests.
 */
function defaultHandler(value) {
    return {yes: "it", "got": "changed"};
}

module.exports = {
    ksTypeName: "postContent",
    isVirtual: true, 
    handlers: defaultHandler
};
```

__Notice the 'isVirtual' property set to true.__

In the example above, we set a function as the value for `handlers` property, this is like setting `handlers` to {default: defaultHandler}
It means that every profile will use this handler.

Calling a post will now return:
{
    "success": true,
    "resultType": "object",
    "modelType": "Post",
    "result": {
        ...
        "content": {
            "yes": "it",
            "got": "changed"
        }
    }
}

### Registering Custom type handlers.
Registration is simple, right before you call keystone.start(restyStone.start()), do:
```
restyStone.registerCustomType(require('./restTypeHandlers/cloudinaryimage'));
restyStone.registerCustomType(require('./restTypeHandlers/postContent'));

keystone.start(restyStone.start());

```
In the example above, we assume that we have a module in the location specified relative to the startup file.  
It is best to work with modules, but essentially a Custom Type Handler is an object with properties that describe how to set it up.