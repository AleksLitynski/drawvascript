
### Drawvascript 
compiles a 2D ascii-flow-chart into 
a chain of javascript callbacks.



Check out [tests/simple.js](https://github.com/tavoe/drawvascript/blob/master/tests/simple.js) or [tests/complex.js](https://github.com/tavoe/drawvascript/blob/master/tests/complex.js) for examples.




Allow me now to paste in an exerpt from the source-code with no explanation:

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
