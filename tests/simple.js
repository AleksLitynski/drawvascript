var drawvascript = require("../src/drawvascript");


var logger = drawvascript.create(
	[' |      ',
	 ' v      ',
	 ' lg     ',
	 ' +>dbl->',
	 ' v      '],
	{
		lg: function(inp){
			console.log(inp.data);
			inp.flow.next.emit(inp.data);
		},
		dbl: function(inp){
			console.log(inp.data);
			inp.flow.next.emit(inp.data*2);
		}
	}
)

logger.flow.next.emit(1);

logger.in.on(function(inp){
	console.log(inp.data);
})


//should see:
// lg 	  -> 1
// logger -> 1
// logger -> 2
