module.exports={
    get:function(id, place, callback)
    {
        if(id)
        {
            $.db.hgetall('user:'+id, function(err, user)
            {
                callback(err || user);
            });
        }
        else
        {
            place=place || 'home';
            $.db.sort('users:at:'+place, 'BY', 'nosort', function(err, users){
                callback(users);
            });
        }
    },
    at:function(place, login, user, callback)
    {
        if(login && !user)
        {
            return $.db.get('users:extenalLogin:'+login, function(err, user)
            {
                if(err)
                {
                    callback(500, err);
                }
                else
                    module.exports.at(place, login, user, callback);
            });
        }
        place=place || 'home';
        $.db.hget('user:'+user, 'place', function(err, oldPlace)
        {
            if(err)
                return callback(500, err);
            var cmds=$.db.multi();
            if(oldPlace)
                cmds=cmds.srem('users:at:'+oldPlace, user);
                
            cmds.sadd('users:at:'+place, user).
                hset('user:'+user, 'place', place).
                exec(function(err, replies){
                    if(!err)
                        callback(200);
                    else
                        callback(500, err);
                });
        })
    }
};