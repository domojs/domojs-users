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
            //db.hget('user')
            db.smembers('users:at:'+place, function(err, users){
                callback(users);
            });
        }
    },
    whoami:function(db, user, callback){
        db.hgetall('user:'+this.request.user, function(err, user)
        {
            if(!user)
            {
                db.hgetall('users:externalLogin:'+user)
            }
            callback(err || user);
        });
    },
    link:function(db, id, callback)
    {
        var currentUser=this.request.user;
        //console.log('getting users:externalLogin:'+id);
        if(!id)
        {
            db.keys('user:*:externalLogins', function(err, users)
            {
                if(err)
                    callback(500, err);
                else
                {
                    users.unshift('users:externalLogin');
                    console.log(users);
                    db.sdiff(users, function(err, devices){
                        if(err)
                            callback(500, err);
                        else
                            callback(200, devices);
                    });
                }
            });
        }
        else
            db.hgetall('users:externalLogin:'+id, function(err, user)
            {
                if(err)
                    callback(500, err);
                else
                    db.hget('user:'+currentUser, 'name', function(){
                        db.multi()
                            .sadd('user:'+currentUser+':externalLogins', id)
                            .hset('users:externalLogin:'+id, 'login', currentUser)
                            .exec(function(err){
                                if(err)
                                    callback(500, err);
                                else
                                    callback(200);
                            });
                        
                    });
            });
    },
    unlink:function(db, id, callback){
        var currentUser=this.request.user;
        console.log('getting users:externalLogin:'+id);
        if(!id)
        {
            db.osort('user:'+currentUser+':externalLogins', ['id', 'name', 'login'], 'nosort', function(err, devices)
            {
                console.log(arguments);
                if(err)
                    callback(500, err);
                else
                    callback(200, devices);
            });
        }
        else
            db.hgetall('users:externalLogin:'+id, function(err, user)
            {
                if(err)
                    callback(500, err);
                else
                    db.hget('user:'+currentUser, 'name', function(){
                        db.multi()
                            .srem('user:'+currentUser+':externalLogins', id)
                            .hdel('users:externalLogin:'+id, 'login', currentUser)
                            .exec(function(err){
                                if(err)
                                    callback(500, err);
                                else
                                    callback(200);
                            })
                        
                    })
            })
    },
    at:function(db, place, login, userLogin, callback)
    {
        db.select(0, function(){
            if(login && !userLogin)
            {
                //console.log('looking for '+login)
                db.hget('users:externalLogin:'+login, 'login', function(err, user)
                {
                    if(err)
                        callback(500, err);
                    else if(user)
                        module.exports.at(db, place, login, user, callback);
                    else
                        callback(404);
                });
                return;
            }
            //console.log('setting '+userLogin+' at '+place+' based on '+login);
            place=place || 'home';
            db.hget('user:'+userLogin, 'place', function(err, oldPlace)
            {
                if(err)
                    return callback(500, err);
                var cmds=db.multi();
                //console.log('moving from '+oldPlace+' to '+place);
                if(oldPlace)
                    cmds=cmds.srem('users:at:'+oldPlace, userLogin);
                    
                cmds.sadd('users:at:'+place, userLogin).
                    hset('user:'+userLogin, 'place', place).
                    exec(function(err, replies){
                        if(err)
                            callback(500, err);
                        else
                        {
                            if(login)
                            {
                                db.hget('users:externalLogin:'+login, 'name', function(err, deviceName){
                                    $.io.emit(deviceName+':at:'+place, {user:userLogin, place:place, device:deviceName});
                                    $.io.emit(userLogin+':at:'+place, {user:userLogin, place:place, device:deviceName});
                                    callback(200);
                                });
                            }
                            else
                            {
                                $.io.emit(userLogin+':at:'+place, {user:userLogin, place:place});
                                callback(200);
                            }
                        }
                    });
            })
        })
    }
};