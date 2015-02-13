


//BODY:

var seriesOfPipes = (function(){

	var self = {

	create : function(diagram, imports, options){
		// Clean up options
		options = self.clean_options(options);

		// Sanitize the user input
		var grid         = self.compiler.gen_grid(diagram, options);
		// convert to list of objects with values and neighbors
		var tolkens      = self.compiler.gen_tolkens(grid, options);
		// convert tolkens to a graph
		var graph 		 = self.compiler.gen_graph(tolkens, options);
		// distinguish between labeled edges and nodes, return new graph.
		// ...todo...
		// convert graph to desired output
		// 		-- callable pipes (**default**)
		// 		-- javascript string
		//		-- graph constructor string (looks like the test case)
		// 		-- debuggable thing (abs positioned, colored output). Can pause, resume, inspect, etc
		var pipes        = self.compiler.gen_pipes(graph, options);
		return pipes;
	},
	clean_options : function(options){
		// The number of spaces to insert at the beginning of the first line
		options.starting_indent = options.starting_indent || 0;
		// The number of spaces a tab should be converted into
		options.tab = options.tab || 4;
		// Do the same for imported libraries
		// Do the same for tolken overloads
	},
	directions : {
		top : "top",
		bottom : "bottom",
		left : "left",
		right : "right",
		null : ""
	},
	compiler : {
		gen_grid : function(input, opts){
			// If the user passed in a string, break it on newlines
			if (typeof input == "string") {
				input = input.split("\n");
			}
			// Let the user set the indent of the first row
			input[0] = Array(opts.starting_indent).join(" ").concat(input[0]);
			// Convert tabs to whatever the user set (default 4)
			input.forEach(function(row){
				row = row.replace(/\t/g, Array(opts.tab).join(" ")))
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
				nodes : [{name:"a", edges: [obj-ref, obj-ref2],{"b", ...],
				}
			*/

			var graph = [];


			// go through the tolkens. Whenever I find a "node", create a node with a list of its neighbor tolkens.

			// go through each node, expand all edges to make connections to each other reachable node. Note that each node can branch into a list of other nodes.
			// remember to respect "throw".

			//turn tolkens into graph
			var tolkens = opts.tolkens || self.default_tokens;

		},
		gen_pipes : function(graph, opts){
			//turn graph into function calls

		}
	},
	// Throws is assumed to be true, unless otherwise stated
	// If no direction is given, assume [] directions
	default_tolkens : {
	//	in-left,  in-right,  in-top,  in-bottom
	//  out-left, out-right, out-top, out-bottom
	"-": {

		directions.left : {targets:[directions.right]},
		directions.right : {targets:[directions.left]}
	},
	"|": {
		directions.top : {targets:[directions.bottom]},
		directions.bottom : {targets:[directions.top]}
	},
	"+": {
		directions.top : {targets:
							[directions.bottom,
							directions.left,
							directions.right],
						throws:false},
		directions.bottom : {targets:
							[directions.top,
							direction.left,
							direction.right],
						throws:false},
		directions.left : {targets:
							[directions.right,
							directions.top,
							directions.bottom],
						throws:false},
		directions.right : {targets:
							[directions.left,
							directions.top,
							directions.bottom],
						throws:false}
	},
	" ": { // Just like a plus, but it does throw

		directions.top : {targets: [	directions.bottom,
										directions.left,
										directions.right]},
		directions.bottom : {targets:[	directions.top,
										direction.left,
										direction.right]},
		directions.left : {targets:[	directions.right,
										directions.top,
										directions.bottom]},
		directions.right : {targets:[	directions.left,
										directions.top,
										directions.bottom]}
	},
	"o": {
		directions.top : {targets:[directions.bottom]},
		directions.bottom : {targets:[directions.top]},
		directions.left : {targets:[directions.right]},
		directions.right : {targets:[directions.left]}
	},
	"<": function(in){
		directions.right : {targets:[directions.left]}
	},
	">": function(in){
		directions.left : {targets:[directions.right]}
	},
	"v": function(in){
		directions.top : {targets:[directions.bottom]}
	},
	"^": function(in){
		directions.bottom : {targets:[directions.top]}
	}
}

})()





















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
	tolkens: seriesOfPipes
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
