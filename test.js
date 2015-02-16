

//BODY:

var seriesOfPipes = (function(){

	var flow = {
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
			forEach(elems, function(elem){
				if(	tolken_name(elem) != filter) {
					fElems.append(elem);
				}
			})
			return fElems;
		},

		mFilter : function(elems, filters){
			var fELems = elems;
			forEach(filters, function(filter){
				fELems.append(flow.fTolkens(fElems, filter));
			})
			return fElems;
		}
	};

	 function create(diagram, imports, options){
		// Clean up options
		options = clean_options(options || {}, imports);

		// Sanitize the user input
		var grid = compiler.gen_grid(diagram, options);

		// get [{value:char, top:ref,bottom:ref,left:ref,right:ref}]
		var tolkens = compiler.gen_tolkens(grid, options);

		// get [{value:string, top:[ref],bottom:[ref],left:[ref,right:[ref]}]
		var lexicon = compiler.gen_lexicon(tolkens, options);

		// get [{value:char, edges:[{value:ref]}]
		var graph = compiler.gen_graph(lexicon, options);

		// get [{value:string, edges:[{value:string,target:ref]}]
		var labeled_graph = compiler.gen_labeled_graph(graph, options);

		// get output_obj.emit("target", {hello:"there"})
		return compiler.gen_target[options.target](labeled_graph, options);
	}

	function clean_options(options, imports){
		// The number of spaces to insert at the beginning of the first line
		options.starting_indent = options.starting_indent || 0;
		// The number of spaces a tab should be converted into
		options.tab = options.tab || 4;

		options.get_prev = options.get_prev || function(e) {return e.left};
		options.get_next = options.get_next || function(e) {return e.right};

		options.imports = transpose(options.imports || [], imports);
		options.tolkens = transpose(tolkens, options.tolkens || []);
		options.target = options.target || targets.invokable;
		options.default_label = options.default_label || "next";

		return options;
	}

	var compiler = {
		// a square 2d array.
		gen_grid : function(input, opts){
			// If the user passed in a string, break it on newlines
			if (typeof input == "string") {
				input = input.split("\n");
			}
			// Let the user set the indent of the first row
			input[0] = Array(opts.starting_indent).join(" ").concat(input[0]);
			// Convert tabs to whatever the user set (default 4)
			forEach(input, function(row){
				row = row.replace(/\t/g, Array(opts.tab).join(" "));
			})
			return input;
		},
		// (name, (top, bottom, left, right))
		// has __root__
		gen_tolkens : function(grid, opts){
			//Make list of tolkens, add a root tolken (the edge of the grid)

			var tolkens = [];
			var graph_root = {
				value: "__root__",top: {}, bottom: {}, left: {}, right: {}
			}
			tolkens.push(graph_root);

			//Create a tolken for each item with a referene to its neighbors
			var tolken_grid = [];
			forEach(grid, function(line, y){
				forEach(line, function(character, x){
					tolken_grid[x] = tolken_grid[x] || [];
					tolken_grid[x][y] = {value: character};
				})
			})

			// gets a grid tolken at x/y, or returns root
			function tolken_at (x, y){

				if( x >= 0 &&
						y >= 0 &&
						x < grid[0].length &&
						y < grid.length ){
					return tolken_grid[x][y];
				} else {
					return graph_root;
				}
			}

			// copy the grid into a list and set left/right/top/bottom to refs.
			forEach(tolken_grid, function(row, x){
				forEach(row, function(tolken, y){
					tolken.top    = tolken_at(x, y-1);
					tolken.bottom = tolken_at(x, y+1);
					tolken.left   = tolken_at(x-1, y);
					tolken.right  = tolken_at(x+1, y);

					/*
						console.log(x, y);
						var sr = function(e){if(e == "__root__"){return "R"} else {return e;}}
						console.log("["+" "+"]["+ sr(tolken.top.value)+"]["+" "+"]");
						console.log("["+sr(tolken.left.value)+"]["+ sr(tolken.value)+"]["+sr(tolken.right.value)+"]");
						console.log("["+" "+"]["+ sr(tolken.bottom.value)+"]["+" "+"]");
						console.log();
					*/

					tolkens.push(tolken);
				})
			})

			return tolkens;
		},

		// (name, ([up], [down], [left], [right]))
		// groups sequences into single objects with multiple up/down/left/right
		gen_lexicon : function(tolkens, opts) {
			var nodes = [];
			var graph_root = {};

			var tolken_name = tolken_namer(opts.tolkens);

			forEach(tolkens, function(tolken){
				//lexemes, unlike tolkens, can have more than 1 top/bottom/left/right
				tolken.left = [tolken.left];
				tolken.right = [tolken.right];
				tolken.top = [tolken.top];
				tolken.bottom = [tolken.bottom];
				if(tolken.value == "__root__"){
					graph_root = tolken;
					return;
				}

				// put all the first-node-in-lexemes in an array
				if(tolken_name(tolken) == "__node__" &&
				(tolken_name(opts.get_prev(tolken)[0]) != "__node__" || opts.get_prev(tolken)[0].value == "__root__")){
					nodes.push(tolken);
					return;
				}

			});

			//connect the border (__root__) to the nodes that touch the border
			forEach(tolkens, function(tolken){
				if(tolken.left.value == "__root__"){graph_root.right.push(tolken)};
				if(tolken.right.value == "__root__"){graph_root.left.push(tolken)};
				if(tolken.top.value == "__root__"){graph_root.bottom.push(tolken)};
				if(tolken.bottom.value == "__root__"){graph_root.top.push(tolken)};
			})

			// we now have a list of the beginning of each node.
			// keep appending tolkens until we build while symbols.
			forEach(nodes, function(node){
				var next = opts.get_next(node)[0];
				while(tolken_name(next) == "__node__" &&
						next.value != "__root__"){
					node.value += next.value;
					node.top    = node.top.concat(next.left);
					node.bottom = node.bottom.concat(next.bottom);
					node.left   = node.left.concat(next.left);
					node.right  = node.right.concat(next.right);
					if(opts.get_next(next)){
						next = opts.get_next(next)[0];
					} else {
						next = undefined;
					}
				}
			});

			nodes.push(graph_root);

			forEach(nodes, function(node){
				function aaa(e){var o = "";forEach(e, function(ee){o += ee.value + ", ";});return o;};
				console.log(node.value);
				console.log("	left: ", aaa(node.left))
				console.log("	right: ", aaa(node.right))
				console.log("	top: ", aaa(node.top))
				console.log("	bottom: ", aaa(node.bottom))
				console.log("")
			})

			return nodes;
		},
		// [{value:node_name, edges[node_refs]}]
		gen_graph : function(lexicon, opts){
			var graph = [];
			var lexeme_to_node = {};

			function make_node(value){
				return {
					value : value,
					edges : []
				}
			}

			forEach(lexicon, function(node){
				var current_node = make_node(node.value);
				current_node.edges = edges_from(current_node);
				graph.push(current);
				lexeme_to_node[node] = current;
			})

			//go over graph and "pull tight" all the edge targets.
			forEach(graph, function(node){
				for(var i = 0; i < node.edges.length; i++){
					node.edges[i] = lexeme_to_node[node.edges[i]];
				}
			})

			//MUST REMOVE NODES THAT LEAD INTO THEMSELVES
			return graph;
		},
		//[{value:node_name, edges:[{value:edge_name,target:node_ref}]}]
		gen_labeled_graph : function(graph, opts){
			//turn graph into graph with labeled edges

			//[node] -- label -- label --> [node] will convert to
			//[node] -- label -- [node] and [node] -- label -- [node]

			// a list of the functions the user defined
			var node_names = {};
			forEach(graph.imports, function(elem, item){
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
				forEach(node, function(edge){
					if(is_node(edge)){
						forEach(edge_values, function(eValue){
							dEdges.push({value:eValue, target:edge})
						})
					} else {
						forEach(direct_edges(edge, edge_values.concat(edge.value)), function(dE){
							forEach(edge_values, function(eValue){
								dEdges.push({value:eValue, target:dE})
							})
						})
					}
				})
				return dEdges;
			}

			forEach(nodes, function(node){
				node.edges = direct_edges(node, opts.default_edge_name);
			})

			return nodes;
		},

		gen_target : {
			//returns "event" object. Has on and emit functions.
			invokable : function(labeled_graph, opts){
				//[{value:node_name, edges:[{value:edge_name,target:node_ref}]}]

				var graph_root = get_root(labeled_graph);

				var events = {};
				function get_event(name){
					events[name] = events[name] || event();
				}
				edge_ittr(graph_root, labeled_graph, function(from, to, via){
					get_event(from).on(via, function(data){
						to(data, get_event(to).emit);
					});
				});

				/*
				  a -> b
				  +- > c
				*/

				return get_root(events);

			},
			evalable : function(){console.log("not doing it right now, sorry.")},
		}
	};

	function edge_ittr(graph_root, all_nodes, on_edge){

		var touched_edges = {}; //source_name : {{edge_name : {target_names}}}
		function touch_edge(node){
			var source = touched_edges[node.value] = touched_edges[node.value] || {};
			var target = source[node.edge.target.value] = source[node.edge.target.value] || {};
			target[node.edge.value] = true;
		}
		function untouched_edges(node){
			return node.edges.filter(function(edge){
				return touched_edges[node.value] &&
				touched_edges[node.value][edge.target.value] &&
				touched_edges[node.value][edge.target.value][edge.value]
			})
		}
		var nodes_to_ittr = [graph_root];// {value:root.value, untouched_edges(root);
		while(edges_to_ittr.length > 0){
			var node = edges_to_ittr.pop();
			forEach(untouched_edges(node.edges), function(edge){
				on_edge(node.value, edge.target.value, edge.value);
				nodes_to_ittr.push(edge.target);
			})

		}
	}

	function get_root(elems){
		return elems.filter(function(elem){
			return elem.value =="__root__";
		})[0];
	}

	function edges_from(tolken){
		var tolken_name = tolken_namer(tolkens);
		var connected_nodes = [];
		var edges_to_search = [];

		//add inital edges
		function dir_elems(elems, dir){
			out = [];
			forEach(into, function(e){
				out.push({edge:e, dir: dir});
			})
			return out;
		}
		edges_to_search.concat(dir_elems(node.left, directions.left));
		edges_to_search.concat(dir_elems(node.right, directions.right));
		edges_to_search.concat(dir_elems(node.up, directions.up));
		edges_to_search.concat(dir_elems(node.down, directions.down));

		while(edges_to_search.length > 0){
			var edge = edges_to_search.pop();
			var next = next_tolken(opts.tolkens, edge.edge.edge_name, edge.dir); //null or the name of a node
			if(next){
				if(tolken_name(next) == "__node__"){ //if its a node, add the node to connected_nodes
					connected_nodes.push(next);
				} else { //if its not a node, add it to the edges_to_search
					edges_to_search.push(next);
				}
			}
		}
		return connected_nodes;
	}

	// need to replace with function
	// Throws is assumed to be true, unless otherwise stated
	// If no direction is given, assume [] directions
	var tolkens = {
		"-": {
			"left" : flow.right,
			"right" : flow.left
		},
		"|": {
			"top" : flow.bottom,
			"bottom" : flow.top
		},
		"+": {
			"top" : function(elem){flow.filter(flow.xTop(elem), " ")},
			"bottom" : function(elem){flow.filter(flow.xBottom(elem), " ")},
			"left" : function(elem){flow.filter(flow.xLeft(elem), " ")},
			"right" : function(elem){flow.filter(flow.xRight(elem), " ")}
		},
		" ": { // Just like a plus, but it does pass into spaces
			"top" : flow.xTop,
			"bottom" : flow.xBottom,
			"left" : flow.xLeft,
			"right" : flow.xRight
		},
		"#": {
			"top" : flow.botton,
			"bottom" : flow.top,
			"left" : flow.right,
			"right" : flow.left
		},
		"<": {"right" : flow.left},
		">": {"left" : flow.right},
		"v": {"top" : flow.bottom},
		"^": {"bottom" : flow.top},
		"__node__" : {
			// any sequence not listed above is a "node"
			"top" : function(elem){flow.mFilter(flow.bottom(elem), ["__node__", " "])},
			"bottom" : function(elem){flow.mFilter(flow.top(elem), ["__node__", " "])},
			"left" : function(elem){flow.mFilter(flow.right(elem), ["__node__", " "])},
			"right" : function(elem){flow.mFilter(flow.left(elem), ["__node__", " "])}
		}
	};

	function next_tolken(tolken_table, tolken, direction){
		var tolken_name = tolken_namer(tolken_table);
		return tolken_table[tolken_name(tolken)][direction];
	}

	var directions = {
		top : "top",
		bottom : "bottom",
		left : "left",
		right : "right",
		jump : "jump"
	};

	var targets = {
		// invokable object
		// eval-able script
		// add debug-able/HTML viewable code
		// an eval-able drawing
		// noflo graph notation
		invokable : "invokable",
		evalable : "evalable",

	};

	var opposite_direction = {
		top : function(){return directions.bottom},
		bottom : function(){return directions.top},
		left : function(){return directions.right},
		right : function(){return directions.left}
	};

	function tolken_namer(tolkens){
		return function(elem) {
			if(elem == undefined) {return undefined;}
			var elem_type = "__node__";
			forEach(tolkens, function(tolken_map, tolken){
				if(elem.value == tolken
					&& tolken != "__node__"){
						elem_type = tolken;
				}
			});
			return elem_type;
		}
	};

	function transpose(a, b){
		var out = {};
		forEach(a, function(e, i){
			out[i] = e;
		});

		forEach(b, function(e, i){
			out[i] = e || out[i];
		});
		return out;
	};

	function event(){
		var data = {
				events : {},
				get : function(name){
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
				forEach(data.get(target).reactions, function(reaction){
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

	function forEach(obj, withEach){
		if(obj.constructor === Array){
			for(var index = 0; index < obj.length; index++){
				withEach(obj[index], index);
			}
		} else {
			for(var index in obj){
				withEach(obj[index], index);
			}
		}
	}


	return {create:create};

})()













//logger.emit("next", {hello:"there"});

//logger.on("", function(input, send){
//	console.log(input);
//});









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

/*
var logger = seriesOfPipes.create(
['        |                                                                     ',
 '        |                                                                     ',
 '        v                                                                     ',
 '       log - error -+->                                                       ',
 '        |           |                                                         ',
 '        +--- other -+                                                         ',
 '        |                                                                     ',
 '        |                                        <-log->                      ',
 '        |                                                                     ',
 '        #          -+                                                         ',
 '        |           |                                                         ',
 '        |           |                                                         ',
 '        +> winning -+                                                         ',
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
	log : function(input, send){
		console.log(input);
		//equivalent of calling emit
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
*/


var logger = seriesOfPipes.create(
	[' v ',
	 'log',
	 ' | '],
	{
		log: function(input, send){
			console.log(input);
			send("next", {all:"done"});
		}
	}
)

/*

var sr = function(e){if(e == "__root__"){return "R"} else {return e;}}
console.log("["+" "+"]["+ sr(tolken.top.value)+"]["+" "+"]");
console.log("["+sr(tolken.left.value)+"]["+ sr(tolken.value)+"]["+sr(tolken.right.value)+"]");
console.log("["+" "+"]["+ sr(tolken.bottom.value)+"]["+" "+"]");
console.log();

*/
