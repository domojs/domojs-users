"use strict";
var di = require("akala-corere");
var passport = require("passport");
var WindowsLiveStrategy = require('passport-windowslive').Strategy;
var MacStrategy = require('passport-macaddress').Strategy;
var debug = require('debug')('domojs:users');
di.injectWithName(['$bus', '$master'], function ($bus, $master) {
    $master(module.filename, './master', null);
    $bus.on('ready', function () {
        di.injectWithName(['$config', '$router', '$bus'], function (config, app, bus) {
            app.use(function (req, res, next) {
                req['isAuthenticated'] = function () {
                    return !!req['user'];
                };
                next();
            });
            app.get('/api/login', passport.authenticate('windowslive', { failureRedirect: '/error', successRedirect: '/' }));
            app.get('/api/login-mac', passport.authenticate('mac', { failureRedirect: '/error', successRedirect: '/' }));
            app.get('/api/user', function (req, res, next) {
                if (!req['isAuthenticated']()) {
                    res.statusCode = 404;
                    res.end();
                }
                else
                    res.send(req['user']);
            });
            app.get('/api/me', di.command(['$request', '$callback'], function ($request, $callback) {
                if (!$request['isAuthenticated']())
                    $callback(404);
                else
                    $callback($request['user']);
            }));
        })();
    });
})();

//# sourceMappingURL=index.js.map
