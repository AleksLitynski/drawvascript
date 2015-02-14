


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
		var lexicon      = self.compiler.gen_lexicon(tolkens, options); //should tag node, not-node. Should have list of top/bottom/left/right. Should chunk out whole nodes
		// use lexicon flow roles to build a graph
		var graph 		 = self.compiler.gen_graph(lexicon, imports, options);
		// distinguish between labeled edges and nodes, return new graph.
		// ...todo...
		// convert graph to desired output
		// 		-- callable pipes (**default**)
		// 		-- javascript string
		//		-- graph constructor string (looks like the test case)
		// 		-- debuggable thing (abs positioned, colored output). Can pause, resume, inspect, etc
		// virtualMachine
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

		options.get_prev = options.get_prev || function(e) {e.left},
		options.get_next = options.get_next || function(e) {e.right},
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
				top    : [root],
				bottom : [root],
				left   : [root],
				right  : [root]
			}
			var void = {
				value  : "__void__",
				top    : [void],
				bottom : [void],
				left   : [void],
				right  : [void]
			}
			tolkens.append(root);
			tolkens.append(void);

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
						top    : [tolken(x, y)],
						bottom : [tolken(x, y)],
						left   : [tolken(x, y)],
						right  : [tolken(x, y)]
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

		// merges tolkens into terms the user provided us.
		// marks items as 'nodes' or 'edge segments'
		gen_lexicon : function(tolkens, opts) {
			var lexicon = {
				edges : [],
				nodes : [],
				root  : {},
				void  : {}
			}

			tolkens.forEach(function(tolken){
				// put all the edges in an array
				if(self.tolken_name(tolken.value) != "__node__"){
					lexicon.edges.push(tolken);
				}
				// put all the left-most nodes in an array
				if(self.tolken_name(tolken.value) == "__node__" &&
				self.tolken_name(opts.get_prev(tolken)) != "__node__"){
					nodes.push(tolken);
				}
				// set reference to "void", any edge that leads to void just sort of... dies
				if(self.tolken_name(tolken.value) == "__void__"){
					lexicon.void = tolken;
				}
				// the border. Edges coming and going from edge can be invoked by the VM.
				if(self.tolken_name(tolken.value) == "__root__"){
					lexicon.void = tolken;
				}
			});

			// roll up all the nodes
			lexicon.nodes.forEach(function(node){
				var next = opts.get_next(node);
				while(self.tolken_name(next) == "__node__"){
					node.value.append(next.value);
					node.top.append(next.left);
					node.bottom.append(next.bottom);
					node.left.append(next.left);
					node.right.append(next.right);
					next = opts.get_next(next);
				}
			});

			return lexicon;
		}
		gen_graph : function(lexicon, opts){

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
	// need to replace with function
	// Throws is assumed to be true, unless otherwise stated
	// If no direction is given, assume [] directions
	tolkens : {
	"-": {
		directions.left : self.flow.right,
		directions.right : self.flow.left
	},
	"|": {
		directions.top : self.flow.bottom,
		directions.bottom : self.flow.top
	},
	"+": {
		directions.top : function(elem){self.flow.filter(self.flow.xTop(elem), " ")},
		directions.bottom : function(elem){self.flow.filter(self.flow.xBottom(elem), " ")},
		directions.left : function(elem){self.flow.filter(self.flow.xLeft(elem), " ")},
		directions.right : function(elem){self.flow.filter(self.flow.xRight(elem), " ")}
	},
	" ": { // Just like a plus, but it does throw

		directions.top : self.flow.xTop,
		directions.bottom : self.flow.xBottom,
		directions.left : self.flow.xLeft,
		directions.right : self.flow.xRight
	},
	"o": {
		directions.top : self.flow.botton,
		directions.bottom : self.flow.top,
		directions.left : self.flow.right,
		directions.right : self.flow.left
	},
	"<": {
		directions.right : self.flow.left
	},
	">": {
		directions.left : self.flow.right
	},
	"v": {
		directions.top : self.flow.bottom
	},
	"^": {
		directions.bottom : self.flow.top
	},
	"__node__" : {
		// any sequence not listed above is a "node"
		directions.top : function(elem){self.flow.mFilter(self.flow.bottom(elem), ["__node__", " "])},
		directions.bottom : function(elem){self.flow.mFilter(self.flow.top(elem), ["__node__", " "])},
		directions.left : function(elem){self.flow.mFilter(self.flow.right(elem), ["__node__", " "])},
		directions.right : function(elem){self.flow.mFilter(self.flow.left(elem), ["__node__", " "])}
	},




	directions : {
		top : "top",
		bottom : "bottom",
		left : "left",
		right : "right",
		null : ""
	},
	flow : {
			right    : function(elem) {return [elem.right];},
			left     : function(elem) {return [elem.left];},
			up       : function(elem) {return [elem.up];},
			down     : function(elem) {return [elem.down];},

			xRight 	 : function(elem) {return [elem.left, elem.up, elem.down];},
			xLeft  	 : function(elem) {return [elem.right, elem.down, elem.up];},
			xUp    	 : function(elem) {return [elem.down, elem.right, elem.left];},
			xDown  	 : function(elem) {return [elem.up, elem.right, elem.left];},
			filter : function(elems, filter) {
				var fELems = [];
				elems.forEach(function(elem){
					if(	self.tolken_name(elem.value) != filter) {
						fElems.append(elem);
					}
				})
				return fElems;
			},
			mFilter : function(elems, filters){
				var fELems = elems;
				filters.forEach(function(filter){
					fELems.append(self.flow.fTolkens(fElems, filter));
				})
				return fElems;
			}
	},
	tolken_name  : function(elem) {
		switch(elem.value){
			case "__node__": return "__node__";
			case "__root__": return "__root__";
			case "__void__": return "__void__";
		}
		if(elem.length > 1){
			return "__node__";
		}
		self.tolkens.forEach(function(tolken){
			if(elem.value == tolken){
				return tolken;
			}
		});
		return "";
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
	tab: 4
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
