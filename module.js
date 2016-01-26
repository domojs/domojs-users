(function(){
    var $module=$('<li class="dropdown"><a href class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">\
                    </a>\
                    <ul class="dropdown-menu" role="menu">\
                        <li><a href="/api">Restart Lifttt</a><li>\
                        <li><a href="/api">Restart domojs</a><li>\
                        <li><a href="/api"></a><li>\
                    </ul>\
                    </li>');
    
    $.getJSON('/api/users/whoami', function(user){
        $('a:first', $module).text(user.name);
    });
                    
    $('#modulePlaceHolder').append($module);
})();

  