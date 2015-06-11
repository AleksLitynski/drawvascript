
### Drawvascript 
compiles a 2D ascii-flow-chart into 
a chain of javascript callbacks.


#### Examples

Check out [tests/simple.js](https://github.com/tavoe/drawvascript/blob/master/tests/simple.js) or [tests/complex.js](https://github.com/tavoe/drawvascript/blob/master/tests/complex.js) for examples.


#### Overview 

Using this library, you can write javascript code as a series of ASCII nodes and labels. 
There can be multiple points of execution in a single graph. So, you can say, "on button press", validate the input, then request data from the server, then BOTH update a field and update a data binding.

#### Usage

Drawvascript.create is the core of the library.

It takes two paramaters (and an optional 'options' parameter). 

The first parameter is a drawing of the graph.

The second parameter is a list of nodes that are functions.

options are: - - -

The code in each node works like this:

The code on the returned node works like this:

The flow control characters in the graph are:
An unleabed edge is implicitily named XXXXXX
Be aware that data will flow backwards unless you explicitly add arrows. So, if a calls xxxx and b calls xxxx the data will just keep ping poinging back an forth.


```

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

```


I found http://asciiflow.com/ modestly useful for drawing flow-charts.
