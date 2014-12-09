>Under construction, To be continued...

##Installation

`resty-stone` is easy to install, just grab the NPM package right after creating a KeystoneJS project.


```
npm isntall shlomiassaf/resty-stone --save
```


##REST Domain Structure
KeystoneJS interaction with the user is done via web pages, for this it maintains 2 UI blocks:
    
  1. Admin UI (read, write)  
  2. Client UI (read)
  
Each block has a different set of permission and different rendering templates.  
This is separation is needed since the admin console and the client UI are totally different.

A REST webservice interacts using __Resources__. (In KeystoneJS REST world, a resource represents a List)  
While each resource has a different structure, they are are presented the same way, JSON.    


To expose a REST __Resource__ `resty-stone` uses 2 objects:
  
  1. RestListMetadata    
  2. RestList
  
Together, these items provide the necessary information need to decide __if__, __how__ and under __which constraints__ a user can interact with a __Resource__
  
##Resource
Resource is a KeystoneJS Lists.  
You can use a resource to add, create, update or delete an instance of a List (e.g: Post, PostCategory, etc..)
The metadata defined to each Resource describe how each resource behaves in different scenarios.
 
##RestListMetadata
`RestListMetadata` is the core defining block of a resource (List).
When no `RestListMetadata` defined, the List will not be available as a resource.  

#### File structure
Each `RestListMetadata` is a node.js module thus each `RestListMetadata` is also a unique file.  
The file name must be identical to the name used to register the List.

For example:
```
var post = new keystone.List('Post', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true }
});

```

  >- The `RestListMetadata` filename representing the above List is __Post__.js  
  >- All `RestListMetadata` files are loaded dynamically, they should be stored in separate directory.


#### Profiles
A `RestListMetadata` define profiles, where each profile has a configuration set defining how the object behave under when used under that profile.  
Currently, there are only 2 profiles available in KeystoneJS:

  - Unauthorized
  - Admin
  
Using the keys __default__ and __isAdmin__ a module defines between the 2.
```
module.exports.default = { ... };
module.exports.isAdmin = { ... };

```
>idAdmin is used to reflect the value of the property in the User model, when KeystoneJS provides a permission model it will change. 

If a default profile is not set `resty-stone` will create one. The default supplied profile deny access to all HTTP verbs.


#### Profile Structure
A Profile describes how a __Resource__ should behave in different scenarios, this includes:

  1. Allow/Deny access to a certain __HTTP VERBs__ (GET, POST, PUT, DELETE, etc...)  
  2. Define the identifier for the resource.   
  3. Define the group of instances for the  __Resource__
  4. Define a logic to handle __HTTP VERBs__
  5. Define the fields allowed for the __Resource__    
    
  Lets look at an example of a profile for Post:
```
module.exports.default = {
    // 1.
    "httpMethods": "get",
    "httpGroupMethods": "get",

    // 2.
    "defaultKey": "slug",

    // 3.
    "permanentFilter": "state:published",

    // 4.
    RestList: some logic handler.
    
    // 5.
    "columns": {
        "visible": [
            "title",
            "publishedDate"      
        ],
        "no_filter": [
            "_id"
        ]
    }
}
```

 - __httpMethods__  
   A comma delimited list of allowed http methods on a direct item (e.g: using a unique key).  
   Defaults to empty list.
   
 - __httpGroupMethods__  
    A comma delimited list of allowed http methods on a query (e.g: without a key).  
    Set true to inherit from httpMethods.  
    Defaults to empty list.  
    
    >It is recommended to set this value explicitly (e.g: don`t set true) to prevent catastrophic results.
    >For protection, setting httpGroupMethods: TRUE will not drill down to inheriting profiles, the inherited value will be the
    >actual httpMethods value of the parent profile and not a reflection of httpMethods of the child profile.
               
  - __defaultKey__  
    The column used to search a single list instance with. (e.g: hello-world in www.site.com/api/post/hello-world)
    If not set defaults to the value of list.autokey.path, if list does`nt contain an autokey then _id is taken.  
    To disable single item access, set to false.  
    
  - __permanentFilter__  
    A filter to set the group a resource can return. (not valid for direct id queries).  
    This filter is added to each query. If keys in permanentFilter exist in a query, permanentFilter will override them.  
    The above example makes sure that Post __Resource will return only 'published' posts for GET requests.  
    The filter is declared using [KeystoneJS 'queryfilter' library](https://github.com/keystonejs/queryfilter).
    
##### Profile Inheritance




>Under construction, To be continued...

