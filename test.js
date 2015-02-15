


//BODY:

var seriesOfPipes = (function(){

	var self = {

	create : function(diagram, imports, options){
		// Clean up options
		options = self.clean_options(options || {}, imports);

		// Sanitize the user input
		var grid         = self.compiler.gen_grid(diagram, options);
		// convert to list of objects with values and neighbors
		var tolkens      = self.compiler.gen_tolkens(grid, options);
		// convert tolkens to a graph
		var lexicon      = self.compiler.gen_lexicon(tolkens, options); //should tag node, not-node. Should have list of top/bottom/left/right. Should chunk out whole nodes
		// use lexicon flow roles to build a graph
		var graph 		 = self.compiler.gen_graph(lexicon, options);
		//some nodes hold the name of an edge, some hold the
		var named_graph = self.compiler.gen_named_graph(graph, options);
		//returns whatever type of output the user asked for
		return self.compiler.gen_target[options.target](named_graph, options);
	},
	clean_options : function(options, imports){
		// The number of spaces to insert at the beginning of the first line
		options.starting_indent = options.starting_indent || 0;
		// The number of spaces a tab should be converted into
		options.tab = options.tab || 4;
		// Do the same for imported libraries
		// Do the same for tolken overloads

		options.get_prev = options.get_prev || function(e) {e.left};
		options.get_next = options.get_next || function(e) {e.right};

		options.imports = self.transpose(options.imports || [], imports);

		options.tolkens = self.transpose(self.tolkens, options.tolkens || []);

		options.target = options.target || self.targets.invokable;

		options.default_label = options.default_label || "next";

		return options;
	},

	compiler : {
		// a square 2d array.
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
		// (name, (top, bottom, left, right))
		// has __root__
		gen_tolkens : function(grid, opts){
			//Make list of tolkens, add a root tolken (the edge of the grid)
			var tolkens = [];
			var root = {
				value  : "__root__",
				top    : [],
				bottom : [],
				left   : [],
				right  : []
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
						return root;
					}
				}
			}

			function touchingEdges(x, y, mX, mY){
				var edges = [];
				if(x == 0)  {edges.push(self.directions.left);}
				if(y == 0)  {edges.push(self.directions.top);}
				if(x == mX) {edges.push(self.directions.right);}
				if(y == mY) {edges.push(self.directions.bottom);}
				return edges;
			}

			//Create a tolken for each item with a referene to its neighbors
			tolken_grid = new Array(grid.length);
			grid.forEach(function(row, y){
				tolken_grid[y] = new Array(row.length);
				row.forEach(function(column, x){
					tolken_grid[x][y] = {
						value  : column,
						top    : [tolken(x, y-1)],
						bottom : [tolken(x, y+1)],
						left   : [tolken(x-1, y)],
						right  : [tolken(x+1, y)]
					};
					// if its on the edge, add it to the roots edges, and add root to its edges.
					touchingEdges(x, y,	row.length-1, column.length-1).
						forEach(function(edge){
							root[self.opposite_direction[edge]()].push(function(){fromTolken});
					});
				})
			})

			// Realize all the neighbor references and build the tolken list.
			tolken_grid.forEach(function(row){
				tolken_grid.forEach(function(column){
					column.top    = column.top();
					column.bottom = column.bottom();
					column.left   = column.left();
					column.right  = column.right();
					tolkens.push(tolken);
				})
			})

			//list of {value: " ", above, below, left, right}
			//one of theim is "__root__",
			//Roots top/bottom/left/right point inwards from the edges
			return tolkens;
		},

		// (name, ([up], [down], [left], [right]))
		// groups sequences into single objects with multiple up/down/left/right
		gen_lexicon : function(tolkens, opts) {
			var nodes = [];
			var root = {};

			var tolken_name = self.tolken_namer(opts.tolkens);

			tolkens.forEach(function(tolken){
				if(tolken.value == "__root__"){
					root = tolken;
					return;
				}
				// put all the left-most nodes in an array
				if(tolken_name(tolken.value) == "__node__" &&
				tolken_name(opts.get_prev(tolken)) != "__node__"){
					nodes.push(tolken);
					return
				}
			});

			// roll up all the nodes
			nodes.forEach(function(node){
				var next = opts.get_next(node);
				while(tolken_name(next.value) == "__node__"){
					node.value.append(next.value);
					node.top.append(next.left);
					node.bottom.append(next.bottom);
					node.left.append(next.left);
					node.right.append(next.right);
					next = opts.get_next(next);
				}
			});

			//withhold void and root so other nodes don't merge into them.
			nodes.push(root);
			return nodes;
		},
		// [{value:node_name, edges[node_refs]}]
		gen_graph : function(lexicon, opts){
			var graph = [];
			var lexeme_to_node = {};

			function make_node(value){
				return {
					value : value,
					edges : [] //list of other nodes
				}
			}

			lexicon.forEach(function(node){
				var current_node = make_node(node.value);
				current_node.edges = self.edges_from(current_node);
				graph.push(current);
				lexeme_to_node[node] = current;
			})

			//go over graph and "pull tight" all the edge targets.
			graph.forEach(function(node){
				for(var i = 0; i < node.edges.length; i++){
					node.edges[i] = lexeme_to_node[node.edges[i]];
				}
			})

			//MUST REMOVE NODES THAT LEAD INTO THEMSELVES
			return graph;
		},
		//[{value:node_name, edges:[{value:edge_name,target:node_ref}]}]
		gen_named_graph : function(graph, opts){
			//turn graph into graph with named edges

			//[node] -- label -- label --> [node] will convert to
			//[node] -- label -- [node] and [node] -- label -- [node]

			// a list of the functions the user defined
			var node_names = {};
			graph.imports.forEach(function(elem, item){
				node_names[item] = true;
			})

			//the nodes in the graph that are imported-functions
			var nodes = graph.filter(function(node){
				return node_names[node.name] == true;
			})
			var is_node = function(n){nodes.indexOf(n) >= 0;}


			//[a] --- b +-------[c]
			//		  +------- f -------- [e]
			//		  +-------[d]     +-- [g]
			function direct_edges(node, edge_values){
				var dEdges = [];
				node.forEach(function(edge){
					if(is_node(edge){
						edge_values.forEach(function(eValue){
							dEdges.push({value:eValue, target:edge})
						})
					} else {
						direct_edges(edge, edge_values.concat(edge.value)).forEach(function(dE){
							edge_values.forEach(function(eValue){
								dEdges.push({value:eValue, target:dE})
							})
						})
					}
				})
				return dEdges;
			}

			nodes.forEach(function(node){
				node.edges = direct_edges(node, opts.default_edge_name);
			})

			return nodes;
		},

		gen_target : {
			//returns "event" object. Has on and emit functions.
			invokable : function(named_graph, opts){
				//[{value:node_name, edges:[{value:edge_name,target:node_ref}]}]
				
			},
			evalable : function(){console.log("not doing it right now, sorry.")},
		}
	},
	edges_from : function (tolken){
		var tolken_name = self.tolken_namer(self.tolkens);
		var connected_nodes = [];
		var edges_to_search = [];

		//add inital edges
		function dir_elems(elems, dir){
			out = [];
			into.forEach(function(e){
				out.push({edge:e, dir: dir});
			})
			return out;
		}
		edges_to_search.concat(self.dir_elems(node.left, self.directions.left));
		edges_to_search.concat(self.dir_elems(node.right, self.directions.right));
		edges_to_search.concat(self.dir_elems(node.up, self.directions.up));
		edges_to_search.concat(self.dir_elems(node.down, self.directions.down));

		while(edges_to_search.length > 0){
			var edge = edges_to_search.pop();
			var next = self.next_tolken(opts.tolkens, edge.edge.edge_name, edge.dir); //null or the name of a node
			if(next){
				if(self.tolken_name(next.value) == "__node__"){ //if its a node, add the node to connected_nodes
					connected_nodes.push(next);
				} else { //if its not a node, add it to the edges_to_search
					edges_to_search.push(next);
				}
			}
		}
		return connected_nodes;
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
	" ": { // Just like a plus, but it does pass into spaces
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
	"<": {directions.right : self.flow.left} ,
	">": {directions.left : self.flow.right},
	"v": {directions.top : self.flow.bottom},
	"^": {directions.bottom : self.flow.top},
	"__node__" : {
		// any sequence not listed above is a "node"
		directions.top : function(elem){self.flow.mFilter(self.flow.bottom(elem), ["__node__", " "])},
		directions.bottom : function(elem){self.flow.mFilter(self.flow.top(elem), ["__node__", " "])},
		directions.left : function(elem){self.flow.mFilter(self.flow.right(elem), ["__node__", " "])},
		directions.right : function(elem){self.flow.mFilter(self.flow.left(elem), ["__node__", " "])}
	},
	next_tolken : function(tolken_table, tolken, direction){
		var tolken_name = tolken_namer(tolken_table);

		return tolken_table[tolken_name(tolken)][direction];
	},
	directions : {
		top : "top",
		bottom : "bottom",
		left : "left",
		right : "right",
		jump : "jump"
	},
	targets : {
		// invokable object
		// eval-able script
		// add debug-able/HTML viewable code
		// an eval-able drawing
		// noflo graph notation
		invokable : "invokable",
		evalable : "evalable",

	},
	opposite_direction : {
			top : function(){return self.directions.bottom},
			bottom : function(){return self.directions.top},
			left : function(){return self.directions.right},
			right : function(){return self.directions.left}
	}
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
	tolken_namer  : function(tolkens){
		return function(elem) {
			tolkens.forEach(function(tolken){
				if(tolken != "__node__" &&
					elem.value == tolken){
						return tolken;
				}
			});
			return "__node__";
		}
	},
	transpose : function(a, b){
		var out = {};
		a.forEach(function(e){
			out.push(e);
		});
		b.forEach(function(e, i){
			out[i] = e || out[i];
		});
		return out;
	},
	event : function(){
		var data = {
				events : {},
				get(name){
					if(events[name]){
						events[name];
					} else {
						events[name] = {
							reactions:[],
							current_value:non_event
						}
					}
				},
				non_event:{}
			}
		return {
			emit : function(target, message){
				data.get(target).reactions.forEach(function(reaction){
					reaction(message);
				});
			},
			on : function(target, reaction){
				var target_obj = data.get(target);
				target_obj.reactions.push(reaction);
				if(target_obj.current_value != data.non_event){
					reaction(current_value)
				}
			}
		}
	}
}

})()













logger.emit("next", {hello:"there"});

logger.on("", function(input, send){
	console.log(input);
});









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
