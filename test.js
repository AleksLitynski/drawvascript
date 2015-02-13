


//BODY:

var seriesOfPipes = {
	
	create : function(diagram, imports, options){
		// Clean up options!!!

		// Sanitize the user input
		var grid         = this.compiler.gen_grid(diagram, options);
		// convert to list of objects with values and neighbors
		var tolkens      = this.compiler.gen_tolkens(grid, options);
		// convert tolkens to a graph
		var graph 		 = this.compiler.gen_graph(tolkens, options);
		// convert graph to callable pipes (or javascript eval string)
		var pipes        = this.compiler.gen_pipes(graph, options);
		return pipes;
	},

	compiler : {
		gen_grid : function(input, opts){
			// If the user passed in a string, break it on newlines
			if (typeof input == "string") {
				input = input.split("\n");
			}
			// Let the user set the indent of the first row
			input[0] = Array(opts.starting_indent || 0).join(" ").concat(input[0]);
			// Convert tabs to whatever the user set (default 4)
			input.forEach(function(row){
				row = row.replace(/\t/g, Array(opts.tab || 4).join(" ")))
			})
			return input;
		},
		gen_tolkens : function(grid, opts){
			//Make list of tolkens, add a root tolken (the edge of the grid)
			var tolkens = [];
			var root = {
				value  : "__root__",
				top    : root,
				bottom : root,
				left   : root,
				right  : root
			}
			tolkens.append(root);

			// function that can be called once the 
			// grid is built to set up reference chains
			function tolken(x, y){
				return function(){
					if( x >= 0 && y >= 0 && 
					x < grid[0].length && 
					y < grid.length ){
						return tolken_grid[x][y];
					} else {
						return root
					}
				}
			}

			//Create a tolken for each item with a referene to its neighbors
			tolken_grid = new Array(grid.length);
			grid.forEach(function(row, row_index){
				tolken_grid[row_index] = new Array(row.length);
				row.forEach(function(column, column_index){
					tolken_grid[row_index][column_index] = {
						value  : column,
						top    : tolken(x, y),
						bottom : tolken(x, y),
						left   : tolken(x, y),
						right  : tolken(x, y)
					}
				})
			})

			// Realize all the neighbor references and build the tolken list.
			tolken_grid.forEach(function(row){
				tolken_grid.forEach(function(column){
					column.top = column.top();
					column.bottom = column.bottom();
					column.left = column.left();
					column.right = column.right();
					tolkens.push(tolken);
				})
			})

			//list of {value: " ", above, below, left, right}
			//one of theim is "root". 
			//Roots top/bottom/left/right are all the same
			return tolkens;
		},
		gen_graph : function(tolkens, opts){

			/* EX:
				// "a" -- "b"
				var graph = {
					nodes : ["a","b"],
					edges : [{0,1}]
				}
			*/

			var graph = {
				nodes : [],
				edges : []
			}
			

			//turn tolkens into graph
			var tolkens = opts.tolkens || seriesOfPipes.default_tokens;

		},
		gen_pipes : function(st_graph, opts){
			//turn graph into function calls

		}
	},
	default_tolkens : {
	//	in-left,  in-right,  in-top,  in-bottom
	//  out-left, out-right, out-top, out-bottom
	"-": function(in){
		if(in == "left") {
			return {targets:["right"], throws:true};
		}
		if(in == "right") {
			return {targets:["left"], throws:true};
		}
		if(in == "up" || in == "down") {
			return {targets:[], throws:true};
		}
	},
	"|": function(in){
		if(in == "top") {
			return {targets:["bottom"], throws:true};
		}
		if(in == "bottom") {
			return {targets:["top"], throws:true};
		}
		if(in == "left" || in == "right") {
			return {targets:[], throws:true};
		}
	},
	"+": function(in){
		if(in == "top") {
			return {targets:["bottom", "left", "right"], throws:false};
		}
		if(in == "bottom") {
			return {targets:["top", "left", "right"], throws:false};
		}
		if(in == "left") {
			return {targets:["right", "top", "bottom"], throws:false};
		}
		if(in == "right") {
			return {targets:["left", "top", "bottom"], throws:false};
		}
	},
	" ": function(in){ // Just like a plus, but it does throw
		if(in == "top") {
			return {targets:["bottom", "left", "right"], throws:true};
		}
		if(in == "bottom") {
			return {targets:["top", "left", "right"], throws:true};
		}
		if(in == "left") {
			return {targets:["right", "top", "bottom"], throws:true};
		}
		if(in == "right") {
			return {targets:["left", "top", "bottom"], throws:true};
		}
	},
	"o": function(in){
		if(in == "top") {
			return {targets:["bottom"], throws:true};
		}
		if(in == "bottom") {
			return {targets:["top"], throws:true};
		}
		if(in == "left") {
			return {targets:["right"], throws:true};
		}
		if(in == "right") {
			return {targets:["left"], throws:true};
		}
	},
	"<": function(in){
		if(in == "right") {
			return {targets:["left"], throws:true};
		}
		if(in == "up" || in == "down" || in == "right") {
			return {targets:[], throws:true};
		}
	},
	">": function(in){
		if(in == "left") {
			return {targets:["right"], throws:true};
		}
		if(in == "up" || in == "down" || in == "left") {
			return {targets:[], throws:true};
		}
	},
	"v": function(in){
		if(in == "top") {
			return {targets:["bottom"], throws:true};
		}
		if(in == "left" || in == "right" || in == "bottom") {
			return {targets:[], throws:true};
		}
	},
	"^": function(in){
		if(in == "bottom") {
			return {targets:["top"], throws:true};
		}
		if(in == "left" || in == "right" || in == "top") {
			return {targets:[], throws:true};
		}
	}
}

};


var edgeTolkens = 























/* NOTES:

tolkenize into 
-) objects with "value" and "up, down, left, right"

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

var logger = seriesOfPipes.create(
[['        |                '],
 ['        |                '],
 ['        v                '],
 ['       log - error -+->  '],
 ['        |           |    '],
 ['        +--- other -+    '],
 ['        v                ']],	 
{
	log : function(input, send){
		console.log(input);
		send("next", {all:"done"});
	}
},
{
	tab: 4,
	starting_indent:0,
	tolkens: edgeTolkens
});

logger.send("", {hello:"there"});

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


