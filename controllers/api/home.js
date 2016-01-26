module.exports={
    get:function(db, id, place, callback)
    {
        if(id)
        {
            db.hgetall('user:'+id, function(err, user)
            {
                callback(err || user);
            });
        }
        else
        {
            place=place || 'home';
            db.smembers('users:at:'+place, function(err, users){
                callback(users);
            });
        }
    },
    whoami:function(db, callback){
        db.hgetall('user:'+this.request.user, function(err, user)
        {
            if(!user)
            {
                db.hgetall('users:externalLogin:'+this.request.user)
            }
            callback(err || user);
        });
    },
    link:function(db, id, callback)
    {
        var currentUser=this.request.user;
        console.log('getting users:externalLogin:'+id);
        db.hgetall('users:externalLogin:'+id, function(err, user)
        {
            if(err)
                callback(500, err);
            else
                db.hget('user:'+currentUser, 'name', function(){
                    db.multi()
                        .hset('user:'+currentUser, 'name', user.name)
                        .hset('users:externalLogin:'+id, 'login', currentUser)
                        .exec(function(err){
                            callback(err);
                        })
                    
                })
        })
    },
    at:function(db, place, login, user, callback)
    {
        if(login && !user)
        {
            //console.log('looking for '+login)
            db.hget('users:externalLogin:'+login, 'login', function(err, user)
            {
                //console.log('found '+user)
                if(err)
                    callback(500, err);
                else if(user)
                    module.exports.at(db, place, login, user, callback);
                else
                    callback(404);
            });
            return;
        }
        //console.log('setting '+user+' at '+place+' based on '+login);
        place=place || 'home';
        db.hget('user:'+user, 'place', function(err, oldPlace)
        {
            if(err)
                return callback(500, err);
            var cmds=db.multi();
            if(oldPlace)
                cmds=cmds.srem('users:at:'+oldPlace, user);
                
            cmds.sadd('users:at:'+place, user).
                hset('user:'+user, 'place', place).
                exec(function(err, replies){
                    if(err)
                        callback(500, err);
                    else
                    {
                        if(login)
                        {
                            db.hget('users:externalLogin:'+login, 'name', function(err, deviceName){
                                $.io.emit(deviceName+':at:'+place, {user:user, place:place, device:deviceName});
                                $.io.emit(user+':at:'+place, {user:user, place:place, device:deviceName});
                                callback(200);
                            });
                        }
                        else
                        {
                            $.io.emit(user+':at:'+place, {user:user, place:place});
                            callback(200);
                        }
                    }
                });
        })
    }
};