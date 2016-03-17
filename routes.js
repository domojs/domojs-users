route.on('me', function(url, params, unchanged){
    $.ajax(loadHtml('users', function(){
        var reload=function(){
            $.getJSON('/api/users/whoami', function(user){
                $('#details .displayName').text(user.name);
                $('#details .place').text(user.place);
            });
            $.getJSON('/api/users/unlink', function(devices){
                debugger;
                $('#user-devices ul.linked').empty();
                $.each(devices, function(i, device){
                    var item=$('<li class="list-group-item"><button type="button" class="close" title="unlink" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="list-group-item-heading"></h4><p class="list-group-item-text"></p></li>');
                    
                    item.find('.list-group-item-heading').text(device.name);
                    item.find('.list-group-item-text').text(device.id);
                    item.find('.close').click(function(){
                        $.post('/api/users/unlink/'+device.id, function(){
                            reload();
                        });
                    });
                    item.appendTo('#user-devices ul.linked');
                });
            });
            
            $.getJSON('/api/users/link', function(devices){
                var select=$('#user-devices ul.unlinked').empty();
                
                $.each(devices, function(i, device){
                    var item=$('<li class="list-group-item"><button type="button" class="close" title="unlink" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="list-group-item-heading"></h4><p class="list-group-item-text"></p></li>');
                    
                    item.find('.list-group-item-heading').text(device);
                    item.find('.list-group-item-text').text(device);
                    item.find('.close').click(function(){
                        $.post('/api/users/link/'+device, function(){
                            reload();
                        });
                    });
                    item.appendTo('#user-devices ul.unlinked');
                });
            });
        };
        
        reload();
    }));
});
 