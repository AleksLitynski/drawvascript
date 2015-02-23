var drawvascript = require("../src/drawvascript");


var thingthing = drawvascript.create([
'                                   ',
'                          lg       ',
'                           ^       ',
'------->   log_pass      delay     ',
'             |             ^       ',
'             +-twice- -action      ',
'     <done     -+                  ',
'                                   ',
'-  -->   quack+---->sayQ           ',
'              +---> sayQ           ',
'              +--- >sayQ           ',
'                                   ',
'                                   '],
{
	//equivelent of calling "on",
    log_pass : function(self){
		console.log(self.data);
		self.out.next.emit(self.data);
	},
    lg : function(self){
        console.log(self.data);
    },
    delay : function(self){console.log("received action")
        setTimeout(self.out.next.with(self.data).fire, 500);
    },
    sayQ : function(){
        console.log("QUACK");
    },
    twice : function(self){
        self.out.action.emit(self.data);console.log("sent action")
        self.out.action.emit(self.data);console.log("sent action")
        self.out.done.emit();
    }
},{});


thingthing.out.next.emit("hey");
