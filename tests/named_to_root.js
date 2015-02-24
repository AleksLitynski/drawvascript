

var drawvascript = require("../src/drawvascript.js");

var named_pass = drawvascript.create([
    '- into                ',
    '     +>pass+          ',
    '           v          ',
    '         through- >   '], // I though there was a problem passing over a node and out. The actual probem is with passing to next and not-next from the same node (next gets mixed into the not-next chain)
{
	//equivelent of calling "on",
    pass : function(s){
        s.flow.through.emit(s.data);
	}
},{
    debug:{
        graph : false,
        labeled_graph: false

    }
});

named_pass.on(function(s){
    console.log(s.data);
})


named_pass.flow.into.emit("whatever");
