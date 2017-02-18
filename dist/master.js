"use strict";
var di = require('node-di2');
var passport = require('passport');
var WindowsLiveStrategy = require('passport-windowslive').Strategy;
var MacStrategy = require('passport-macaddress').Strategy;
var debug = require('debug')('domojs:users');
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});
di.injectWithName(['$config', '$router'], function (config, app) {
    if (config && config.microsoft) {
        passport.use(new WindowsLiveStrategy({
            clientID: config.clientID,
            clientSecret: config.clientSecret,
            callbackURL: config.callbackURL
        }, function (accessToken, refreshToken, profile, done) {
            var db = di.resolve('$db');
            db.hget('users:externalLogin:' + profile.id, 'login', function (err, user) {
                if (err) {
                    db.quit();
                    done(err);
                }
                else {
                    if (!user) {
                        db
                            .multi()
                            .sadd('users:externalLogins', 'users:externalLogin:' + profile.id)
                            .hmset('users:externalLogin:' + profile.id, { name: profile.displayName, provider: profile.provider })
                            .exec(function (err) {
                            db.quit();
                            done(err);
                        });
                    }
                    else {
                        db.quit();
                        done(null, user);
                    }
                }
            });
        }));
    }
    passport.use(new MacStrategy(function (mac, done) {
        if (mac && mac.mac) {
            var db = di.resolve('$db');
            db.hget('users:externalLogin:' + mac.mac, 'login', function (err, userId) {
                if (!userId) {
                    db
                        .multi()
                        .sadd('users:externalLogins', 'users:externalLogin:' + mac.mac)
                        .hmset('users:externalLogin:' + mac.mac, { provider: 'mac', name: mac.name })
                        .exec(function (err) {
                        db.quit();
                        done(err);
                    });
                    debug('unauthorized', mac);
                }
                else
                    db.quit();
                if (err)
                    done(err);
                else
                    done(null, userId);
            });
        }
        else {
            done(null, { name: 'localhost' });
        }
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(function (req, res, next) {
        console.log(req.socket.remoteAddress);
        if (req.socket.remoteAddress.substr(0, '192.168.'.length) != '192.168.' && req.socket.remoteAddress != '127.0.0.1' && req.socket.remoteAddress != '::1') {
            if (req.url != '/api/users/login' && !req['isAuthenticated']()) {
                debug('windowslive');
                var handler = passport.authenticate('windowslive', { scope: ['wl.signin', 'wl.basic'] });
                handler(req, res, next);
            }
            else
                next();
        }
        else {
            if (req.url != '/api/users/login' && !req['isAuthenticated']()) {
                debug('mac');
                var handler = passport.authenticate('mac');
                handler(req, res, next);
            }
            else
                next();
        }
    });
})();

//# sourceMappingURL=master.js.map
