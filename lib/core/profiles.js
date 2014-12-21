var enums = require("./enums"),
    _ = require("underscore");

function Profile(name, rank) {
    this.name = name;
    this.rank = rank;
}

Profile.prototype.hasPrev = function() { return (this.prev) ? true : false; };
Profile.prototype.hasNext = function() { return (this.next) ? true : false; };
Profile.prototype.name = undefined;
Profile.prototype.rank = undefined;
Profile.prototype.prev = undefined;
Profile.prototype.next = undefined;

var _profiles;
function Profiles() {
    _profiles = {};

    _profiles[enums.SYSTEM_PROFILES.UNAUTHORIZED] = new Profile(enums.SYSTEM_PROFILES.UNAUTHORIZED, 0);
    this.first = _profiles[enums.SYSTEM_PROFILES.UNAUTHORIZED];
}

Profiles.prototype.first = undefined;

function insertAt(existingProfile, newProfile) {
    newProfile.next = existingProfile;

    if (existingProfile.hasPrev()) {
        newProfile.prev = existingProfile.prev;
        existingProfile.prev.next = newProfile;
    }
    else {
        this.first = newProfile;
    }
    existingProfile.prev = newProfile;
}

/**
 *
 * @param {string} name
 * @param {number} rank greater then 1
 */
Profiles.prototype.add = function add(name, rank) {
    rank = parseInt(rank);
    if (!rank || rank < 1) return;

    _profiles[name] = new Profile(name, rank);

    var runner = this.first;
    while(true) {
        if (runner.rank >= rank) {
            insertAt(runner, _profiles[name]);
            break;
        }
        if (runner.hasNext()) {
            runner = runner.next;
        }
        else {
            runner.next = _profiles[name];
            _profiles[name].prev = runner;
            break;
        }
    }
};

/**
 * Returns the profile for a user.
 * @param user
 * @returns {String}
 */
Profiles.prototype.detectProfile = function detectProfile(user) {
    if (user) {
        return (user.canAccessKeystone === true) ? this.getProfile(enums.SYSTEM_PROFILES.ADMIN) : this.getProfile(enums.SYSTEM_PROFILES.AUTHORIZED);
    }
    else {
        return this.getProfile(enums.SYSTEM_PROFILES.UNAUTHORIZED);
    }
};

Profiles.prototype.getProfile = function(name) {
    return _profiles[name] || undefined;
};

/**
 * Finds a profile as a key in an object.
 * Does a fallback search by rank.
 * Returns the value of the key or undefined if nothing found.
 * @param profile
 * @param obj
 */
Profiles.prototype.searchProfile = function searchProfile(profile, obj) {
    if (! profile) return undefined;
    return obj[profile.name] || this.searchProfile(profile.prev, obj);
}
module.exports = new Profiles();