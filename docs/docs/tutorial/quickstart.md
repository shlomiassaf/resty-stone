# Quick Start  

A demonstration of a simple REST API for a blog.  
We will be using [Keystone Generator](https://github.com/keystonejs/generator-keystone) to scaffold a new KeystoneJS app.  

__Scaffolding KeystoneJS__  
You'll need Node.js >= 0.10.x and MongoDB >= 2.4.x installed.  

Install the Keystone generator (For any issued see [Keystone Generator](https://github.com/keystonejs/generator-keystone)):  
```
$ npm install -g generator-keystone
```

Create a new directory and generate a new KeystoneJS app:
```
$ mkdir myblog
$ cd myblog
$ yo keystone
```
Enter __Y__ when asked if it is a blog.

Install `resty-stone`:  
```
npm install resty-stone --save
```


Create a new directory to hold Metadata for our REST exposed models:  
```
$ mkdir rest_model
$ cd rest_model
```

## Resource Metadata  
KeystoneJS Models are called List. By default every List model is hidden and access to it vie REST is not allowed.  
To expose a List model to REST we need to define a Metadata object describing a security model and logic for the resource.  

Create a new file in the directory `rest_model` called `Post.js`.  
Notice the file name is identical to the List model name, this is how `resty-stone` pair a List model with Metadata.
  
```
module.exports.default = {
    "defaultKey": "slug",
    "permanentFilter": "state:published",
    "httpMethods": "get",
    "httpGroupMethods": "get",
    "columns": {
        "visible": [
            "title",
            "content.brief"
        ],
         "no_filter": [
             "state",
             "slug",
             "_id"
         ]
    }
}

module.exports.authorized = {
    "__extends__" = "default",
    "permanentFilter": undefined,
    "httpMethods": "get post",
    "columns": {
        "visible": [
            "title",
            "publishedDate",
            "slug",
            "author",
            "content",
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

module.exports.admin = {
    "__extends__" = "authorized",
    "permanentFilter": undefined,
    "httpMethods": "get post delete",
    "httpGroupMethods": "get",
}
```

So, what is happening here?

We defined 3 different behaviors, 1 for each profile in the system:  
  1. default(unauthorized) 
  2. authorized  
  3. admin  

We are also extending the `default` behavior using the __extends__ key followed by the name of the profile we extend.  
Note that extending is only available for 1st level parameter, e.g: extending columns.visible will overwrite columns.no_filter

<strong><u>default (unauthorized) behavior</u></strong>:  
The definition grants read only access to all users. (registered or guests)  
Only `published` Post instances are exposed.  
Only the `title` and the `brief` are exposed.  


<strong><u>authorized behavior</u></strong>:  
The definition grants authorized users the ability to get and create Posts.    
Overwriting `permanentFilter` means __all__ post instances are exposed.  
There are also more visible columns exposed.  

<strong><u>admin behavior</u></strong>:
The definition grants admin users the same ability as authorized users plus the ability to DELETE posts.      
  

A short description for every meta property:  
  - __defaultKey__          : The identifier column for the resource, default to _id. `www.restapi.com/api/:identifier`  
  - __permanentFilter__     : A fixed filter added to every query on the resource.  
  - __httpMethods__         : The allowed methods when accessing the resource using an identifier. (space delimited)  
  - __httpGroupMethods__    : The allowed methods when accessing the resource without an identifier. (space delimited)  
  - __columns.visible__     : An array of column names the exposed by the api.
  - __columns.no_filter__   : An array of column names the user can not use for filtering.  
  - __RestList__            : Defines resource behaviors, an instance of restyStone.RestList or derived class instance.
  
This is it, we have now exposed `Post` to the WebAPI.  
The metadata acts as a security model for a resource, defining what is allowed at which security level.  
To define the behavior of a model, once access is allowed, `RestList` class`s/instances are used.

## RestList
RestList is responsible for 2 tasks:  
  1. The behavior of a exposed resource for every HTTP method and/or remote procedure calls (RPC).  
  2. Transformation of a result instance. (similar to view rendering)
  
resty-stone comes with a generic RestList implementation that handles GET, POST, PUT and DELETE http methods.  
The generic RestList return the result instance without transformation (as is).

<strong><u>1. HTTP method handling / RPC</u></strong>:  
A RestList object is a simple Javascript object with properties matching HTTP method names (lower case).
Each property points to a function used to handle the request and return a result.  
A valid http method function accepts 2 parameters: `function(req, cb)`  
__req__: Express REQUEST object with additional properties about the REST state.  
  - req.restApi - Metadata information about the resource.  
  - req.list    - Keystone List model for the resource.  
     
__cb__: A Callback to send the result for the operation.  
Callback is fired with 3 parameters:  
  1. Error object, send undefined when no error occurred.  
  2. A `ResponseContainer` object with detailed information about the response.  
  3. A Boolean value indication if the results (in `ResponseContainer`) needs rendering (calling _render and applying custom file type transformation)  
    
<strong>Remote Procedure Calls</strong>:  
It is possible to create your own method handlers for custom methods (NON HTTP VERB methods).  
It is very simple, simple define a new property, the name of the property is the method name used for accessing it.  
The value of the property is a method handler similar to get, post, put and delete handlers.  
To call an RPC add a query string parameter named `action` containing a value matching the method name you implemented in RestList.  
> Functions starting with _ are not accessible using RPC, use this convention to protect private function implemented in a RestList.

```
restList.doStudf= function(req, cb) {...};
```

```
http://www.restapi.com/api/posts?action=doStuff
```

<strong><u>1. Transformation / Rendering</u></strong>:  
Transformation is the final step before the object is sent to serialization (Custom field types, then JSON).  
The transformation is done using the `_render` function in RestList.   
The native implementation of _render in RestList does nothing.  You can override it and implement you logic.  

```
var restyStone = require("resty-stone")(keystone);
var myRestlist = new restyStone.RestList();

myRestList._render = function(req, instance) {
     instance.newProperty = "this is not part of the model but will show in the result";
     return instance;
 };
```

> Please review `./lib/RestList.js` ([GitHub Link](https://github.com/shlomiassaf/resty-stone/blob/master/lib/RestList.js)) relative to resty-stone package to get a better understanding how to extend a RestList.
   
You can implement a RestList by simply creating an instance of it and overwriting some functions.  
Functions not overwritten will keep their original behavior.  
```
var restyStone = require("resty-stone")(keystone);
var myRestlist = new restyStone.RestList();

myRestList.get = function(req, cb) {
    cb(new restyStone.ApiException(400, false, "I am faking this HTTP 400 error for you");
}
```

For complex scenarios inherit RestList and create instances of your newly derived class.  

To pair a model/profile with a your own version of RestList, set it in the metadata:  
```
module.exports.default = {
    "defaultKey": "slug",
    "permanentFilter": "state:published",
    "httpMethods": "get",
    "httpGroupMethods": "get",
    "columns": {
        "visible": [
            "title",
            "content.brief"
        ],
         "no_filter": [
             "state",
             "slug",
             "_id"
         ]
    },
    "RestList" = myRestList
}
```

> Remember that every profile in every resource can use a different implementation of RestList.  
> You can create an implementation of RestList per group, per item or any other combination you can think about.  

## Authentication  
Authentication in resty-stone is done using the built-in KeystoneJS authentication.  
You can expose models using the `default` profile thus authentication is optional.  

<strong><u>Auth Endpoints</u>:</strong>  
The following Authentication endpoint are used:  
__Login__:  `www.mywebapi.com/api/auth/login`  
__Logout__: `www.mywebapi.com/api/auth/logout`

> The above assumes: `keystone.set('resty api base address', "/api");`  
> Don't forget to send the api token to logout requests.

There are 2 types of authentication:  
  - Session based authentication  
  - Token bases authentication

To select which authentication method to use, it should be set before calling restyStone.start().  
> The default authentication method is Token.

### Session based authentication  
Session based authentication uses Keystone's built-in authentication module.  
This is a cookie based authentication module and it is not recommended for use in a WebAPI as it exposes the api to CSRF attacks.  
To enable:  
```
keystone.set('resty auth type', restyStone.enums.AUTH_TYPE.SESSION ); 
```

Log in is done using a POST request to `www.mywebapi.com/api/auth/login`  containing the following body:  
```
{
    "email": "use email",
    "password": "user pass"
}
```

The cookie returned from the call should be used from now on with each api call.

### Token based authentication  
resty-stone has a built-in __Basic Auth__ token based authentication.  
To enable it:  
  - Set `resty auth type` to restyStone.AUTH_TYPE.TOKEN  
  - Set `resty token header` to the header name used for the token.
```
keystone.set('resty auth type', restyStone.AUTH_TYPE.TOKEN );
keystone.set('resty token header', "api-token" );
```

You can use __Basic Auth__ or simple user object in the request body, formatted as json (identical to keystone login).  
For example, login for username __demo__ and pasword __demo-pass__:   

<strong><u>Basic Auth</u>:</strong>  
```
Authorization: Basic ZGVtbzpkZW1vLXBhc3M
```
<strong><u>Request body</u>:</strong>  
```
{
  "email": "demo",
  "password": "demo-pass"
}

```

<strong><u>A successful authentication will return</u>:</strong>  
```
{
    "success": true,
    "resultType": "notSet",
    "modelType": "notSet",
    "result": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJrZXlzdG9uZS5zaWQiOiJfUzRveUxlRFBPZk1NQ2k2eGI4QVNleDIifQ.Rp6o1ZyvF25Otstf3aXnJjugqM2DSQj2lxhlB8h9qbU"
}
```  
The property `success` indicates the result status, the property `result` holds the token.
You can now use this token in the header of each call to authenticate it.

> Token authentication 'rides' on top of the build-in KeystoneJS authentication, this means any persistence session model you use will apply.


## Custom Field Type Handling  
A Custom field type handler controls the transformation of a field into an object exposed to the end user.  
resty-stone comes with an extension that handles built-in KeystoneJS custom field types (not fully complete...)  

You can create new custom field type handlers to overwrite or implement support for new custom field types.
 
Custom field type handlers are registered when resty-stone starts.  
Registration is done via event, the event handler is a function with 1 parameter - a custom field type handler registrator.  
```
var restyStone = require("resty-stone")(keystone);
/*  
        Init here....
*/
restyStone.events.on(restyStone.enums.EVENTS.REGISTER_CUSTOM_TYPES, init);

function init(registrator) {
    for (var i in types) {
        registrator(types[i]);
    }
};

keystone.start(restyStone.start());
```
In the example above, `types` is an Array of Custom types handlers.


You can assign custom field type handlers to a specific type or to a specific column in a specific List.  
This approach allow high level control over fields while still provide the option achieve fine-grained control over a List or a group of List's  


## Endpoint Structure
## Response Container