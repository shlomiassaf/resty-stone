# resty-stone

Rest API toolkit for KeystoneJS.

A powerful and robust toolkit for building Web API`s.

Click here for [Documentation](http://shlomiassaf.github.io/resty-stone)

####See [example](./example) directory to understand how to init a basic REST.

## Key features:
###Works out of the box
resty-stone requires only metadata, tell it what a resource can or cant do, it will take care of the "REST".

### REST Domain  
resty-stone create a new layer of metadata to control the behavior of List instances.  
The allows a high level of customization per List instance/group.

### Token based authentication:
resty-stone comes with built-in support for __Basic Auth__ authentication built on top of KeystoneJS authentication.
This means separate auth modules but same behavior.

###Highly customizable:    
resty-stone lets you control the behavior of your List or let it do its magic automatically.  
Customize fields, request handling, serialization, filtering, custom remote functions and more.
 
### Relay on KeystoneJS building blocks:    
resty-stone uses KeystoneJS infrastructure where possible.  
This helps keeping performance aligned and creates a unified experience.
 
### AdminUI separation:  
resty-stone create a clear separation between AdminUI configuration and REST domain configuration.


## Install:
Not published on NPM at the moment, use:
```
npm isntall shlomiassaf/resty-stone --save
```

##TODO:
- Implement nested List handling.
- Support more authentication policies (OAuth1, OAuth2)
- Auto-generate client (native js, angular)?

#LICENCE: MIT