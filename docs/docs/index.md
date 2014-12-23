# resty-stone

Rest API toolkit for KeystoneJS.

A powerful and robust toolkit for building Web API`s.

Click here for [Documentation](http://shlomiassaf.github.io/resty-stone)

####See [example](https://github.com/shlomiassaf/resty-stone/tree/master/example) directory to understand how to init a basic REST.

## Key features:  
 - __Works out of the box__  
 resty-stone requires only metadata, tell it what a resource can or cant do, it will take care of the "REST".
 
 - __REST Domain__    
 resty-stone create a new layer of metadata to control the behavior of List instances.  
 The allows a high level of customization per List instance/group.
 
 - __Token based authentication__  
 resty-stone comes with built-in support for __Basic Auth__ authentication built on top of KeystoneJS authentication.  
 This means separate auth modules but same behavior.
 
 - __Highly customizable__      
 resty-stone lets you control the behavior of your List or let it do its magic automatically.  
 Customize fields, request handling, serialization, filtering, custom remote functions and more.
 
 - __Relay on KeystoneJS building blocks__     
 resty-stone uses KeystoneJS infrastructure where possible.  
 This helps keeping performance aligned and creates a unified experience.
 
 - __AdminUI separation__  
 resty-stone create a clear separation between AdminUI configuration and REST domain configuration.


##Install
```
npm install resty-stone --save
```


## Example  
Lets demonstrate a simple WebAPI for the model Post in a KeystoneJS blog.  
We will expose a read only (HTTP GET) access for all users (unauthenticated & authenticated).  
The only Post instanced we expose are Post's with a state = 'published', we only expose 3 columns: title, slug and content.brief
First, define the metadata for the resource:
```
module.exports.default = {
    "httpMethods": "get",
    "defaultKey": "slug",
    "permanentFilter": "state:published",
    "columns": {
        "visible": [
            "title",
            "slug",
            "content.brief"
        ]
    }
}
```
We will save this file in `./rest_model/Post.js`

Now, in the startup file for our app (keystone.js) we will initialize resty-stone:
```
var keystone = require('keystone');

/*
        Keystone init code here...
*/

var restyStone = require("resty-stone")(keystone); 
keystone.set('resty api base address', "/api");
keystone.set('resty meta location', "./rest_model");
keystone.start(restyStone.start());
```

Now browse to `http://www.yourapidomain.com/api/posts`, you should see:
```
{
    "success": true,
    "resultType": "array",
    "modelType": "Post",
    "result": [
        {
            "_id": "5480b21f7a43bca82c1d34e8",
            "slug": "hello-world",
            "title": "Hello World!"
            "content": {
                "brief": "this is a short brief for hello world post!",                
            }
        },
        {
            "_id": "6535b25375435ca52c1444e1",
            "slug": "hello-world-2",
            "title": "Hello World#2!"
            "content": {
                "brief": "this is a short brief for hello world #2 post!",                
            }
        }
    ],
    "pagination": {
        "total": 2,
        "currentPage": 1,
        "totalPages": 1,
        "pages": [
            1
        ],
        "previous": false,
        "next": false,
        "first": 1,
        "last": 2
    }
}
```


##TODO:
- Implement nested List handling.
- Support more authentication policies (OAuth1, OAuth2)
- Auto-generate client (native js, angular)?

##LICENCE  
The MIT License (MIT)

Copyright (c) 2014 Shlomi Assaf

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

