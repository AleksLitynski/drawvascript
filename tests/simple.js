var drawvascript = require("../src/drawvascript");


var logger = drawvascript.create(
	[' |      ',
	 ' v      ',
	 ' lg     ',
	 ' +>dbl->',
	 ' v      '],
	{
		lg: function(self){
			console.log(self.data);
			self.out.next.emit(self.data);
		},
		dbl: function(self){
			self.out.next.emit(self.data*2);
		}
	}
)

logger.out.next.emit(1);

logger.in.on(function(self){
	console.log(self.data);
})


//should see:
// lg 	  -> 1
// logger -> 1
// logger -> 2
