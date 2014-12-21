module.exports.AUTH_TYPE = {
    SESSION: 1,             // Classic KeystoneJS session authentication, CSRF vulnerable!.
    TOKEN: 2               // API Token, riding on built in session handler.
    // TODO: Support more
    // JsonWebTokens
    // OAuth1,2
}

module.exports.SYSTEM_PROFILES = {
    UNAUTHORIZED: "default",
    AUTHORIZED: "authorized",
    ADMIN: "admin"
}

module.exports.EVENTS = {
    BEFORE_REGISTER_ROUTES: "restyBeforeRegisterRoutes",
    AFTER_REGISTER_ROUTES: "restyAfterRegisterRoutes",
    REGISTER_CUSTOM_TYPES: "restyRegisterCustomTypes"
}
