var drawvascript = require("../src/drawvascript");


var thingthing = drawvascript.create([
'                                   ',
'                       +  -log_pass',
'                       v     ^     ',
'------->   log_pass        delay   ',
'             |               |     ',
'             +-     twice- action  ',
'                <done-+            ',
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
		self.flow.next.emit(self.data);
	},
    delay : function(self){
        setTimeout(self.flow.next.with(self.data), 500);
    },
    sayQ : function(){
        console.log("QUACK");
    },
    twice : function(self){
        self.state.count = self.state.count || 0;
        if(self.state.count < 2){
            self.flow.action.emit(self.data);
            self.state.count++;
        } else {
            self.flow.done.emit("twice is nice, but thrice is wise");
            self.state.count = undefined;
        }
    }
},{});


thingthing.flow.next.emit("hey");

thingthing.on(function(self){
    console.log(self.data);
})
