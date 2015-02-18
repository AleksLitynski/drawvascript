// This project is called "drawvascript" (pun on javascript, draw-va, java, get it, damn it)

//BODY:

var seriesOfPipes = (function(){

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
		top : directions.bottom,
		bottom : directions.top,
		left : directions.right,
		right : directions.left
	};

	var flow = {
		right    : function(elem){
						return [{target:elem.right, direction:directions.right}]
					},
		left     : function(elem){
						return [{target:elem.left, direction:directions.left}]
					},
		top       : function(elem){
						return [{target:elem.top, direction:directions.top}]
					},
		bottom     : function(elem){
						return [{target:elem.bottom, direction:directions.bottom}]
					},

		xRight 	 : function(elem){
						return [
							{target:elem.left, direction:directions.left},
							{target:elem.top, direction:directions.top},
							{target:elem.bottom, direction:directions.bottom}]
					},
		xLeft  	 : function(elem){
						return [
							{target:elem.right, direction:directions.right},
							{target:elem.bottom, direction:directions.bottom},
							{target:elem.top, direction:directions.top}]
					},
		xTop   	 : function(elem){
						return [
							{target:elem.bottom, direction:directions.bottom},
							{target:elem.right, direction:directions.right},
							{target:elem.left, direction:directions.left}]
					},
		xBottom	 : function(elem){
						return [
							{target:elem.top, direction:directions.top},
							{target:elem.right, direction:directions.right},
							{target:elem.left, direction:directions.left}]
					},

		filter : function(elems, filter, tolkens) {
			var tolken_name = tolken_namer(tolkens);
			var fElems = [];
			forEach(elems, function(elem){
				if(	tolken_name(elem) != filter) {
					fElems.append(elem);
				}
			})
			return fElems;
		},

		mFilter : function(elems, filters, tolkens){
			var fElems = [];
			forEach(filters, function(filter){
				fElems = fElems.concat(flow.filter(fElems, filter, tolkens));
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

		options.text_dir = options.get_prev ||  directions.right;

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

		// (name, ([top], [bottom], [left], [right]))
		// groups sequences into single objects with multiple top/bottom/left/right
		gen_lexicon : function(tolkens, opts) {
			var nodes = [];
			var graph_root = {};
			//A map from tolken IDs to the tolken they are a part of after compaction
			var tolken_name = tolken_namer(opts.tolkens);
			var tolken_id_to_node = {};

			var tidIdx = 0;
			forEach(tolkens, function(tolken){
				tolken.id = tidIdx;
				tidIdx++;

				if(tolken.value == "__root__"){
					graph_root = {value:tolken.value, left:[],right:[],top:[],bottom:[]};
					return;
				}

				// put all the first-node-in-lexemes in an array
				if(tolken_name(tolken) == "__node__"){
					if(tolken_name(tolken[opposite_direction[opts.text_dir]]) != "__node__" ||
					tolken[opposite_direction[opts.text_dir]].value == "__root__"){
						var node = {value:tolken.value, left:[tolken.left],right:[tolken.right],top:[tolken.top],bottom:[tolken.bottom]};
						nodes.push(node);
						tolken_id_to_node[tolken.id] = node;
						return;
					}
				}

			});

			//connect the border (__root__) to the nodes that touch the border
			forEach(tolkens, function(tolken){
				if(tolken.left.value == "__root__"){graph_root.right.push(tolken)};
				if(tolken.right.value == "__root__"){graph_root.left.push(tolken)};
				if(tolken.top.value == "__root__"){graph_root.bottom.push(tolken)};
				if(tolken.bottom.value == "__root__"){graph_root.top.push(tolken)};
			});


			// we now have a list of the beginning of each node.
			// keep appending tolkens until we build while symbols.
			forEach(nodes, function(node){
				var next = node[opts.text_dir][0];
				while(tolken_name(next) == "__node__" &&
						next.value != "__root__"){
					node.value += next.value;
					tolken_id_to_node[next.id] = node;


					//remove item you're absorbing from own text_dir side
					node[opts.text_dir].splice(node[opts.text_dir].indexOf(next), 1);

					//if we're going top/bottom or left/right, don't add items on those sides.
					if(opts.text_dir == directions.left || opts.text_dir == directions.right){
						node.top.push(next.top);
						node.bottom.push(next.bottom);
					}
					if(opts.text_dir == directions.top || opts.text_dir == directions.bottom){
						node.left.push(next.left);
						node.right.push(next.right);
					}

					//if we're at the end of the line, add in the last element
					if(tolken_name(next[opts.text_dir]) != "__node__" ||
						next[opts.text_dir].value == "__root__" ){
						node[opts.text_dir].push(next[opts.text_dir]);
					}

					// get the next node, if it exists.
					if(next[opts.text_dir]){
						next = next[opts.text_dir];
					} else {
						break;
					}
				}
			});
			nodes.push(graph_root);


			// Make references to "l"|"o"|"g" ==> "log"
			function cTolken(tolken){
				return tolken_id_to_node[tolken.id] || tolken
			}
			for(var i = 0; i < tolkens.length; i++){
				tolkens[i].left = cTolken(tolkens[i].left);
				tolkens[i].right = cTolken(tolkens[i].right);
				tolkens[i].top = cTolken(tolkens[i].top);
				tolkens[i].bottom = cTolken(tolkens[i].bottom);
			}
			// Kills me to use a for-loop, but there were assignment by reference vs. value issues
			for(var i = 0; i < nodes.length; i++){
				for(var j = 0; j < nodes[i].left.length; j++){
					nodes[i].left[j] = cTolken(nodes[i].left[j]);
				}
				for(var j = 0; j < nodes[i].right.length; j++){
					nodes[i].right[j] = cTolken(nodes[i].right[j]);
				}
				for(var j = 0; j < nodes[i].bottom.length; j++){
					nodes[i].bottom[j] = cTolken(nodes[i].bottom[j]);
				}
				for(var j = 0; j < nodes[i].top.length; j++){
					nodes[i].top[j] = cTolken(nodes[i].top[j]);
				}
			}

			// remove duplicates
			forEach(nodes, function(node){
				function uniques(itm, pos, self){
					return self.indexOf(itm) == pos;
				}
				node.left = node.left.filter(uniques);
				node.right = node.right.filter(uniques);
				node.top = node.top.filter(uniques);
				node.bottom = node.bottom.filter(uniques);
			})

			/*
			forEach(nodes, function(node){
				function aaa(e){var o = "";forEach(e, function(ee){o += ee.value + ", ";});return o;};
				console.log(node.value);
				console.log("	left: ", aaa(node.left))
				console.log("	right: ", aaa(node.right))
				console.log("	top: ", aaa(node.top))
				console.log("	bottom: ", aaa(node.bottom))
				console.log("")
			})
			*/


			return nodes;
		},
		// [{value:node_name, edges[node_refs]}]
		gen_graph : function(lexicon, opts){
			var graph = [];
			var node_to_lexeme = {};
			forEach(lexicon, function(node){
						console.log("trucking");
				var current_node = {value:node.value, edges:edges_from(node, opts)};
							console.log("so hard");
				graph.push(current_node);
				node_to_lexeme[node] = current_node;
			})

			//go over graph and "pull tight" all the edge targets.
			forEach(graph, function(node){
				for(var i = 0; i < node.edges.length; i++){
					node.edges[i] = node_to_lexeme[node.edges[i]];
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

	function edges_from(node, opts){
		console.log("WOO");
		var tolken_name = tolken_namer(opts.tolkens);

		function all_nodes_reachable_from_tolken(tolken, direction){
			var out = [];
			var next_elems = opts.tolkens[tolken_name(tolken)][direction] || function(){};
			console.log(opts.tolkens[tolken_name(tolken)])
			forEach(next_elems(tolken, opts.tolkens), function(next){
			//	console.log("		["+next.target.value+"]");
				if(next){
					if(tolken_name(next.target) == "__node__"){
						//if its a node, add the node to connected_nodes
						out.push(next.target);
					} else {
						//if its not a node, add it to the edges_to_search
						out = out.concat(all_nodes_reachable_from_tolken(next.target, next.direction));
					}
				}
			});
			return out;
		}

		function all_nodes_reachable_from_edge(edge){
			var out = [];
			forEach(node[edge], function(tolken){
				opts.tolkens["__node__"][edge]
				var nxt = all_nodes_reachable_from_tolken(tolken, edge);
				out = out.concat(nxt)

				var z = "";
				forEach(nxt, function(n){z += n.value + ", ";});
		//		console.log("	[" + tolken.value + "] => [" + z + "]");
			})
			return out;
		}
	//	console.log("["+node.value+"]");
		var out = all_nodes_reachable_from_edge(directions.left)
			.concat(all_nodes_reachable_from_edge(directions.right))
			.concat(all_nodes_reachable_from_edge(directions.top))
			.concat(all_nodes_reachable_from_edge(directions.bottom));

		return out;
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
			"top" : function(elem, tolkens){return flow.filter(flow.xTop(elem), " ", tolkens)},
			"bottom" : function(elem, tolkens){return flow.filter(flow.xBottom(elem), " ", tolkens)},
			"left" : function(elem, tolkens){return flow.filter(flow.xLeft(elem), " ", tolkens)},
			"right" : function(elem, tolkens){return flow.filter(flow.xRight(elem), " ", tolkens)}
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
			"top" : function(elem, tolkens){return flow.mFilter(flow.bottom(elem), ["__node__", " "], tolkens)},
			"bottom" : function(elem, tolkens){return flow.mFilter(flow.top(elem), ["__node__", " "], tolkens)},
			"left" : function(elem, tolkens){return flow.mFilter(flow.right(elem), ["__node__", " "], tolkens)},
			"right" : function(elem, tolkens){return flow.mFilter(flow.left(elem), ["__node__", " "], tolkens)}
		}
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
		if(!obj){return;}
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

	function conpend(a, b){
		if(b.constructor === Array){
			return a.concat(b);
		} else {
			a.push(b);
			return a;
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
	[' v   ',
	 'log  ',
	 ' |woo'],
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
