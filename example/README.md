## Background:
This example use the basic KeystoneJS generator structure configured to support a blog.  
The main resource our blog use is the Post, we will expose this resource via REST.

## Structure:
Consider the current directory level as the root of your KeystoneJS project.

| Path                                      | Type    | Desc                                                                        |
| ----------------------------------------- | ------- | --------------------------------------------------------------------------- |
| `./keystone.js`                           | File    | Exists in your project, modified to init resty-store.                       |
| `./routes`                                | Folder  | Exists in your project.                                                     |
| `./routes/api`                            | Folder  | Does not exist, please create. Holds all metadata for exposed __Resources__ |
| `./routes/api/Post.js`                    | File    | Does not exist, please create. Defines Post resource metadata               |
| `./customTypeHandlers/postContent.js`     | File    | Does not exist, please create. Defines Custom field type handler            |
| `./customTypeHandlers/cloudinaryimage.js` | File    | Does not exist, please create. Defines Custom field type handler            |


## Initialization
`resty-stone` needs to start before KeystoneJS starts. (__keystone.start();__)  
Starting first provides the ability to automatically register all routes against resources and provide essential services on top of KeystoneJS.

Defining `resty-stone` settings is done the same way as defining KeystoneJS settings.

Take a look at `./keystone.js`, the only change is:  
___Replacing:___  
```
keystone.start();
```
 
 __With__:  
```
// register rest.
var restyStone = require("resty-stone")(keystone);

// you can omit this line, it is the same as the default and here for demo only.
keystone.set('resty api base address', "/api"); 

// provide the relative path from your project's root, to your Resource metadata folder.

keystone.set('resty meta location', "./routes/api"); 

// keep KeystoneJS cookie based session for auth (use in dev only!)
keystone.set('resty auth type', restyStone.AUTH_TYPE.SESSION ); 

// register a custom type handler.
restyStone.registerCustomType(require('./restTypeHandlers/postContent'));

// you can supply 'event' to restyStone.start(), it wil propagate.
keystone.start(restyStone.start()); 
```  
> __NOTE__:  
> It is also possible execute `restyStone.start()` and `keystone.start()` separately, as long as `restyStone.start()` comes 1st.
> Note that this might break future behavior as `resty-stone` might wrap certain KeystoneJS events.

__This is it, the API is ready to lunch.__  
If you lunch it now you wont be able to access any resource, we did not setup metadata for __Resources__ yet.

## Authentication:
resty-stone has a built-in __Basic Auth__ token based authentication.  
To enable it:  
  - Set `resty auth type` to restyStone.AUTH_TYPE.TOKEN  
  - Set `resty token header` to the header name used for the token.
```
keystone.set('resty auth type', restyStone.AUTH_TYPE.TOKEN ); // keep KeystoneJS cookie based session for auth (use in dev only!)
keystone.set('resty token header', "api-token" );
```

###Endpoints:  
__Login__:  SERVER/BASE_ADDRESS/auth/login
__Logout__: SERVER/BASE_ADDRESS/auth/logout

Example for the server `www.example.com` with `resty api base address` set to `/api`:
```
http://www.example.com/api/auth/login
http://www.example.com/api/auth/logout
```

> NOTE:  
> Don't forget to send the api token to logout requests.

### Authentication methods:
You can use __Basic Auth__ or simple user object in the request body, formatted as json (identical to keystone login).  
For example, login for username __demo__ and pasword __demo-pass__:   
##### Basic Auth
```
Authorization: Basic ZGVtbzpkZW1vLXBhc3M
```
##### Request body
```
{
  "email": "demo",
  "password": "demo-pass"
}

```

A successful authentication will return:
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

## Exposing Resources:
Each List model in KeystoneJS is not exposed by default.
To expose a List model we need to create metadata according to our business rules.

There are 2 levels for a Resource Metadata:

1. Profile
2. Profile Metadata for the resource.

So, A Resource Metadata is:

- __A File__, that:  
- __Defines a NodeJS module__, that:  
- __Exports properties__, that are:  
- __Resource Metadata Profile__ for a specific resource under a specific profile.

> __NOTE:__  
> The file name must be the same as the name used to register its corresponding List model, case sensitive.  
> For example, the file name should be the __bold__ part from: var Post = new keystone.List(__'Post'__, {});

Currently there are 3 profiles:

| Name        | Desc                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| default     | The default profile for not authorized users. (if set, resource is public)  |
| authorized  | Profile for registered users.                                               |
| admin       | Profile for administrator/s                                                 |

Take a look at `./routes/api/Post.js` for an example.


> __NOTES:__
> - These are the only profiles, at least until KeystoneJS supports multiple profiles.  
> - Setting a `default` profile exposes a resource to any request, authorized or not.

### Metadata Inheritance:   
Sometimes, most of the difference between profiles is minor.  
In such cases, add an "\_\_extends\_\_" property to the profile you wish to extend and set the value to the name of the parent profile. 

```
module.exports.default = {
    "httpMethods": "get",
     "columns": {
            "visible": [
                "title"
            ]
     }
}

module.exports.admin = {
    "__extends__": "default",

    "httpMethods": "get,post,put,delete",
    "httpGroupMethods": true,                 // true will result in duplicating httpMethods to httpGroupMethods    
}
```

In the example above, __admin__ has the same output structure as __default__, they both also accept 'get' HTTP VERBS.
However, admin accepts post, put and delete HTTP VERBS.

> __NOTE__:  
> Extending a profile currently support first level properties, deeper levels are not supported.  
> For example, extending "columns->visible" only will cause "columns->no_fileds" to be empty, it will not inherit the parents "columns->no_fileds" as it is 2nd level.
 
## Customizing a Resource Behavior:
Out of the box, `resty-stone` has a built-in generic resource behavior module that supports 4 HTTP VERBS (GET, POST, PUT, DELETE).
You might find it more then enough for your needs.
However if you want to more control over your resources, no problem.
  
It is very easy to customize a Resource behavior, customization is stacked from 3 layers:

  1. Resource or group of resources.  
  2. Profile.  
  3. HTTP VERB (GET, POST, PUT, DELETE, custom rpc, etc...).
  4. Serialization (Transformation)

Layers 1 & 2 are set in __Resource Metadata Profile__.  
Layer 3 & 4 are functions implemented on an instance of a `resty-stone` class called `RestList`.
 
By assigning a `RestList` to a profile we define the __Resource Handler__ for a Resource.  
This assignment is done using the __RestList__ property in profile, the value should be an instance of `RestList`.

### RestList
`RestList` is an object responsible of handling request and transforming the response.  

Request handling is done using __Function Handlers__, a function handler is a function that receive an `express` Request  
and a callback and returns a result. The result is sent to a __Transformation handler__ and then sent back to the client.

`RestList` works with 3 types of function handlers:

1. HTTP Verb function handlers.  
2. RPC function handlers.  
3. Transformation handlers

#### HTTP Verb function handlers
Function handlers that compose a REST interface for a Resource.  
Each function handles a HTTP VERBS.    
Pairing a function handler with a HTTP VERB is done by HTTP VERB name, `RestList` properties that match HTTP VERBS reference a function handler for that verb.  
All HTTP VERBS are treated as LOWER CASE, this means that `RestList.GET = function() {..}` will not work.  
The built-in `RestList` handles HTTP GET, POST, PUT, DELETE.  

#### RPC function handlers
RPC, or `remote procedure call` is the ability to invoke a specific, non REST complaint, operation on a __Resource__.

To create an RPC simply add a function handler to your custom `RestList`, the key referencing the new RPC function is the RPC function name.  
To invoke a RPC use add a query string key called action with a value representing the RPC name. 

Example: `www.myapi.com/api/Post?action=myRpc` will call invoke `myRpc` on the Post `RestList`.

> __WARNING:__  
> - Due to the nature of RPC, please make sure your are not exposing public methods that are not Resource Handlers!  
> - RPC name starting with an underscore (_) is not a valid RPC name, it will never invoke. (e.g: `RestList._render`)  
> - RPC validation comes AFTER Resource VERB validation, this means that an RPC request using HTTP GET for an object with no GET permission will fail.  
> - RPC does not care if it was called on a Resource or on a Resource group, this logic should be handled in the Function handler.

#### Transformation handlers
`RestList` is also responsible for object serialization, it is not exactly a serialization process but more a transformation process.
  
Since KeystoneJS is built on NodeJS & MongoDB, serialization is built in, we only need to transform.

Transformation is done using the public function `_render(req, instance)` that gets an `express` Request and an instance of the resource
and returns the instance transformed (or not...)  
The built-in `RestList` simply returns the instance as is, without changing it.

`resty-stone`'s built-in `RestList` is used by default for all Resources, unless told otherwise.

#### All Together  
To customize a `RestList`:  
- Create a new instance of it (`new RestList()`)  
- Create or overwrite functions to customize a resource to your desire.  
- Set relevant metadata profiles to reference the new `RestList`

To sum it up:  
Use __Resource Metadata__ to differentiate __Metadata__ based on __Resource__.  
Use __Resource Metadata Profile__ to differentiate a __Resource__ based on __Profiles/Authentication__.  
Use __RestList__ to differentiate __Behaviors__ based on a __Profile__ or a __Resource__.  

This pattern provides the ability to create custom behaviors for group of resource, specific resources and profiles.  
Combine it with __Function Handlers__ & __Transformation Handlers__ to achieve fine-grained control over your resources.

By working with instances of `RestList` you make sure default behavior is kept for all resource's throughout the API but still customize those places where the business model is different.


`RestList` also support advanced scenarios where a hierarchy of `RestList` classes can be built (using prototype inheritance) to support complex business models. 
