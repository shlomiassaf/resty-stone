# resty-stone #

Rest API toolkit for KeystoneJS.

A powerful and robust toolkit for building Web API`s.

####Key features:

  - __REST Domain__  
    `resty-stone` creates a new layer of metadata to control the behavior of `List` instances.  
    The allows a high level of customization per List instance/group.
  - __Highly customizable__  
    `resty-stone` lets you control the behavior of your `List` or let it do its magic automatically.  
    Customize fields, request handling, serialization, filtering, custom remote functions and more.
    
  - __Relay on KeystoneJS building blocks__  
    `resty-stone` uses [KeystoneJS](http://www.keystonejs.com) infrastructure where possible.  
    This helps keeping performance aligned and creates a unified experience.
    
  - __AdminUI separation__  
    `resty-stone` creates a clear separation between Keystons's AdminUI configuration and REST domain configuration.


## Install:
Not published on NPM at the moment, use:
```
npm isntall shlomiassaf/resty-stone --save
```

##IMPORTANT TODO:
- Add API token authentication (currently relay on session, which is not CSRF proof).

##TODO:
- Implement nested List handling.
- Support more authentication policies (OAuth1, OAuth2)
- Auto-generate client (native js, angular)?

#LICENCE: MIT