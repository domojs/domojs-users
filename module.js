(function(){
    var $module=$('<li class="user module"><a href="#me" role="button" aria-expanded="false">\
                    </a>\
                    </li>');
    
    $.getJSON('/api/users/whoami', function(user){
        if(user)
            $('a:first', $module).text(user.name);
    });
                    
    $('#modulePlaceHolder').append($module);
})();

  