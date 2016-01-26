var WindowsLiveStrategy=require('passport-windowslive').Strategy;
var MacStrategy=require('passport-macaddress').Strategy;

var passport=require('passport');

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
            var db=$.db.another();
            db.hget('users:externalLogin:'+profile.id, 'login', function(err, user){
                if(err)
                {
                    db.quit();
                    done(err);
                }
                else
                {
                    if(!user)
                    {
                        db.hmset('users:externalLogin:'+profile.id, {name:profile.displayName, provider:profile.provider}, function(err){
                            db.quit();
                            done(err);
                        });
                    }
                    else
                    {
                        db.quit();
                        done(null, user);
                    }
                }
            });
        }));
	passport.use(new MacStrategy(function(mac, done){
        if(mac)
        {
            var db=$.db.another();
            db.hget('users:externalLogin:'+mac, 'login', function(err, userId){
                
                if(!userId)
                {
                    db.hmset('users:externalLogin:'+mac, {provider:'mac'}, function(err){
                            db.quit();
                            done(err);
                        });
                    console.log(mac +' is unauthorized');
                }
                else
                    db.quit();
                if(err)
                    done(err);
                else
                    done(null, userId);
            });
        }
        else
        {
            done(null,{name:'localhost'});
        }
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
	    if(!req.socket.remoteAddress.startsWith('192.168.') && req.socket.remoteAddress!='127.0.0.1')
	    {
    	    if(req.url!='/api/login' && !req.isAuthenticated())
    	    {
    		    console.log('windowslive')
    			passport.authenticate('windowslive', {scope:['wl.signin','wl.basic']})(req,res,next);
    	    }
    	    else
    	        next();
	    }
		else
		{
    	    if(req.url!='/api/login' && !req.isAuthenticated())
    	    {
    		    console.log('mac')
		        passport.authenticate('mac')(req,res,next);
    	    }
			else
			    next();
		}
	});
};
