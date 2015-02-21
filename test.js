// This project is called "drawvascript" (pun on javascript, draw-va, java, get it, damn it)

//BODY: 1234

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

		all 	 : function(elem){
						return [
							{target:elem.right, direction:directions.right},
							{target:elem.left, direction:directions.left},
							{target:elem.top, direction:directions.top},
							{target:elem.bottom, direction:directions.bottom}]
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
			return elems.filter(function(elem){
				return tolken_name(elem.target) != filter
			})
		},

		node : function(elem, tolkens){
			var flatElems = [];
			forEach(flow.all(elem), function(tolken_group){
				forEach(tolken_group.target, function(tolken){
					flatElems.push({target:tolken, direction:
						tolken_group.direction});
				})
			})
			flatElems = flow.filter(flatElems, " ", tolkens)
			flatElems = flow.filter(flatElems, "__node__", tolkens)

			return flatElems;
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

		options.imports = transpose({"__root__":{}}, transpose(options.imports || [], imports));
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
					console.log("["+" "+				  "]["+ sr(tolken.top.value)+   "]["+" "+                   "]");
					console.log("["+sr(tolken.left.value)+"]["+ sr(tolken.value)+       "]["+sr(tolken.right.value)+"]");
					console.log("["+" "+                  "]["+ sr(tolken.bottom.value)+"]["+" "+                   "]");
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
			var tolken_to_node = {};
			var current_id = 1;
			forEach(lexicon, function(lexeme){
				var current_node = {value:lexeme.value, edges:edges_from(lexeme, opts)};
				graph.push(current_node);

				current_node.id = lexeme.id = current_id;
				tolken_to_node[lexeme.id] = current_node;
				current_id++;

			})

			forEach(graph, function(node){
				for(var i = 0; i < node.edges.length; i++){
					if(node.edges[i] != undefined){
						node.edges[i] = tolken_to_node[node.edges[i].id] || node.edges[i];
					}
				}
			})
			/*
			forEach(graph, function(node){
				console.log(node.value);
				forEach(node.edges, function(edge){
					console.log("	" + edge.value);
				})
			})
			*/

			//MUST REMOVE NODES THAT LEAD INTO THEMSELVES
			return graph;
		},
		//[{value:node_name, edges:[{value:edge_name,target:node_ref}]}]
		gen_labeled_graph : function(graph, opts){
			//turn graph into graph with labeled edges

			var unlabeled_to_labeled = {};

			// a list of the functions the user defined
			var node_names = {};
			forEach(opts.imports, function(elem, item){
				node_names[item] = true;
			})
			var is_node = function(node){
				return node_names[node.value] == true;
			}
			var nodes = graph.filter(function(node){
				return is_node(node);
			})
			//console.log(node_names)

			function named_edges_from(node, edge_names, backtrack){
				backtrack.push(node.id);

				var found_named_edges = [];
				forEach((node.edges || [])
					.filter(function(e){
						if(e){
							var index = backtrack.indexOf(e.id)
							return index == -1
						}
					}),
				function(edge_target){
					if(is_node(edge_target)){
						var names = edge_names;
						if(edge_names.length == 0){
							names.push(opts.default_label)
						}
						forEach(names, function(edge_name){
							found_named_edges.push({
								value:edge_name
								,target:edge_target
							//	,en:edge_names
							//	,bt:backtrack
							})
						})
					} else {
						found_named_edges = found_named_edges
						.concat(named_edges_from(
							edge_target,
							edge_names.concat(edge_target.value),
							backtrack))
					}
				})
				return found_named_edges;
			}

			forEach(nodes, function(node){
				// There is something WRONG with how __root__ is numbered.
				// I think it was 0 in some other life, and now things only
				// match up if I keep calling it zero
				if(node.value == "__root__"){node.id = 0;}
				node.edges = named_edges_from(node, [], []);
			})

			// remove duplicates
			for(var i = 0; i < nodes.length; i++){
				var edge_set = {}
				for(var j = 0; j < nodes[i].edges.length; j++){
					edge_set[						//unique based on
						nodes[i].edges[j].target.id //target id
					  +	nodes[i].edges[j].value 	//and edge's name
					] = nodes[i].edges[j];
				}
				nodes[i].edges = [];
				for(var n in edge_set){
					nodes[i].edges.push(edge_set[n]);
				}
			}

			/*
			forEach(nodes, function(node){
				console.log(node.value + " (" + node.id + ")")
				forEach(node.edges, function(edge){
					console.log("	over [" + edge.value + "] to ["+edge.target.value  + "] (" + edge.target.id + ")")
				})
			})
			*/

			return nodes;
		},

		gen_target : {
			//returns "event" object. Has on and emit functions.
			invokable : function(labeled_graph, opts){
				var event_graph = [];
				var graph_root = {};

				function get_event_node(node){
					return event_graph[node.id]
						= event_graph[node.id]
						= event_graph[node.id]
						|| event_node(node.value);
				}
				function get_outbound_event(source, via){
					var event_node = get_event_node(source);
					return new_event
						= event_node.out[via]
						= event_node.out[via]
						|| event();
				}

				// traverses only nodes reachable from a given node
				from_node(get_root(labeled_graph), function(from, to, via){
					var ob_event = get_outbound_event(from, via); //event
					ob_event.on(function(data){
						var event_node = get_event_node(from) //{in:event, data:{}, out:[event]}
						event_node.data = data;
						event_node.in.emit(event_node);
					})
				});

				return get_root(event_graph, "name");

			},
			evalable : function(){console.log("not doing it right now, sorry.")},
		}
	};

	function from_node(graph_root, on_edge){

		var touched_nodes = {};
		var nodes_to_ittr = [graph_root];
		while(nodes_to_ittr.length > 0){
			var current_node = nodes_to_ittr.pop();
			if(touched_nodes[current_node.id] != true){
				touched_nodes[current_node.id] = true;

				forEach(current_node.edges, function(edge){
					on_edge(current_node, edge.target, edge.value);
					nodes_to_ittr.push(edge.target);
				})
			}
		}

	}

	function get_root(elems, prop_name){
		prop_name = prop_name || "value";
		return elems.filter(function(elem){
			return elem[prop_name] =="__root__";
		})[0];
	}

	function edges_from(node, opts){
		var tolken_name = tolken_namer(opts.tolkens);
	//	console.log(node.value + ": ")

		function all_nodes_reachable_from(tolken, direction, path){
			direction = opposite_direction[direction]
		//	var pth = "";
		//	forEach(path, function(p){
		//		pth += "["+p.value + "], "
		//	})
		//	console.log(pth + " leads [" + direction + "] into [" + tolken.value + "]" + " cross: " + tolken[opposite_direction[direction]].value)
			var out = [];
			var next_elems = opts.tolkens[tolken_name(tolken)][direction];
			if(next_elems == undefined || path.indexOf(tolken) >= 0) {return;}

			forEach(next_elems(tolken, opts.tolkens),
					function(next){
				//		console.log("	" + next.target.value)

						if(tolken_name(next.target) == "__node__"){
				//			console.log(pth + " ==> " + next.target.value);
							out.push(next.target);
						} else {
							out = out.concat(
								all_nodes_reachable_from(
									next.target,
									next.direction,
									path.concat([tolken])
								));
						}
					//	console.log()
					});
			return out;
		}

		var out = [];
		forEach(opts.tolkens[tolken_name(node)]["any"](node, opts.tolkens),
					function(tolken_direction){
						//console.log("	Hits [" + tolken_direction.target.value + "] from the [" + tolken_direction.direction + "]");
						out = out.concat(all_nodes_reachable_from(
							tolken_direction.target,
							tolken_direction.direction,
							[]))
				})

		/*forEach(out, function(o){
			console.log("	" + o.value);
		})*/

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
		" ": { // Just like a #, but, treated differently by '+' and '__node__'
			"top" : flow.bottom,
			"bottom" : flow.top,
			"left" : flow.right,
			"right" : flow.left
		},
		"#": {
			"top" : flow.bottom,
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
			"any" : flow.node
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

	event = function(){
	    var no_data = {};
	    var data = no_data;
	    var listeners = [];
	    var self = {
	        on : function(new_listener){
	            listeners.push(new_listener);
	            if(data != no_data){
					new_listener(data);
	            }
	            return self;
	        },
	        emit : function(new_data){
	            self.with(new_data);
	            self.fire();
	            return self;
	        },
	        with : function(new_data){
	            data = new_data;
	            return self;
	        },
			fire : function(){
	            if(data != no_data){
					forEach(listeners, function(listener){
						setTimeout(function(){listener(data)}, 0);
					});
	            }
	            return self;
	        }
	    }
	    return self;
	}

	function event_node(name){
		return {in:event(), data:{}, name:name, out:[]}
	}


	function forEach(obj, withEach){
		if(!obj){return;}
		if(obj.constructor === Array){
			for(var index = 0; index < obj.length; index++){
				if(obj[index] != undefined){
					withEach(obj[index], index);
				}
			}
		} else {
			for(var index in obj){
				if(obj[index] != undefined){
					withEach(obj[index], index);
				}
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
	[' v      ',
	 ' +-log2-',
	 'log     ',
	 ' |woo   '],
	{
		log: function(self){
			// note that the function will be attached to the event_node,
			// so this and self are interchangable
			console.log(this.data);
			self.out.next.emit({all:"done"});
		},
		log2: function(self){
			console.log(self.data + " 2");
			console.log(self);
			self.out.next.emit({all:"done2"});
		}
	}
)

logger.out.next.with("hey grrl").fire();
logger.in.on(function(self){
	console.log(self.data);
})

for(var ed in logger.out){
	console.log(ed);
}



/*
var logger = seriesOfPipes.create(
	['  |  ',
	 '     '],
	{
		log: function(input, send){
			console.log(input);
			send("next", {all:"done"});
		}
	}
)
*/
