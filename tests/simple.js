


//logger.emit("next", {hello:"there"});

//logger.on("", function(input, send){
//	console.log(input);
//});









/* NOTES:

tolkenize into
-) objects with "value" and "top, bottom, left, right"

lexerize into
-) word (list of border objects/targets)
-) edge

find items from libraries and list borders above, below, left, right

build flow chains ( objects with 'above, below, left, right' objects) (has "flow above, below, left, right")

trace all source flow chains, prune 'dead' ones.
prune dead chains

//http://asciiflow.com/


	*/


//TEST:

/*
	log:
		other -> root
		winning -> root
		next -> root
		victory -> root
	root:
		next -> log
	log:
		next -> root
*/
/*
var logger = seriesOfPipes.create(
['        |                                                                     ',
 '        +  -woob  -+                                                          ',
 '        v          ^                                                          ',
 '       log -error-<+->                                                        ',
 '        |          |                                                          ',
 '        +- -other- +                                                          ',
 '        |                                                                     ',
 '        |                                        <-log->                      ',
 '        |                                                                     ',
 '-       #          -+                                                         ',
 '        |           +---   Victory-->                                         ',
 '        |           |                                                         ',
 '        +>-winning--+                                                         ',
 '        |                                                                     ',
 '        |                                                                     ',
 '        |                                                                     ',
 '        |                                                                     ',
 '        |                                                                     ',
 '        |                                                                     ',
 '        |                                                                     ',
 '        |                                                                     ',
 '        |                                                                     ',
 '        |                                                                     ',
 '        |                                                                     ',
 '        v                                                                     '],
{
	//equivelent of calling "on",
	log : function(input, flow_to){
		console.log(input);
		//equivalent of calling emit
		console.log(flow_to);
		flow_to.next.emit({all:"done"});
	}
},
{
	tab: 4
});



logger.emit("next", {hello:"there"});

logger.on("", function(input, send){
	console.log(input);
});

logger.on("error", function(input, send){
	console.log("error!!");
	console.log(input);
});

logger.on("other", function(input, send){
	console.log("error!!");
	console.log(input);
});
*/




var logger = seriesOfPipes.create(
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
// lg -> 1
// logger -> 1
// logger -> 2
