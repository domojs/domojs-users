var WindowsLiveStrategy=$('passport-windowslive').Strategy;
var MacStrategy=$('passport-macaddress').Strategy;

var passport=$('passport');

passport.serializeUser(function(user,done){
	done(null,user);
});
	
passport.deserializeUser(function(user,done){
	done(null, user);
});

exports.init=function(config, app)
{
	passport.use(new WindowsLiveStrategy({
		clientID: config.clientID,
		clientSecret: config.clientSecret,
		callbackURL: config.callbackURL
	},
	function(accessToken, refreshToekn, profile, done){
	    console.log(profile);
		done(null,profile);
	}));
	passport.use(new MacStrategy(function(mac, done){
	    console.log(mac);
	    done(null,mac);
	}));
	$.use(passport.initialize());
	$.use(passport.session());
	$.get('/api/login', passport.authenticate('windowslive', {failureRedirect:'/error', successRedirect:'/'}));
	$.get('/api/login-mac', passport.authenticate('mac', {failureRedirect:'/error', successRedirect:'/'}));
	
	$.get('/api/user', function(req,res,next){
		if(!req.isAuthenticated())
		{
			res.statusCode=404;
			res.end();
		}
		else
			res.send(req.user);
	});
	$.use(function(req,res,next)
	{
	    if(req.url!='/api/login' && !req.isAuthenticated() && global.localServer.port!=req.socket.localPort)
			passport.authenticate('windowslive', {scope:['wl.signin','wl.basic']})(req,res,next);
		else
		    passport.authenticate('mac')(req,res,next);
	});
};