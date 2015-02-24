var drawvascript = require("../src/drawvascript.js");

var interleaver = drawvascript.create([
'                                   ',
'    +         -log-            +   ',
'    v           ^              v   ',
'              delay                ',
'                ^                  ',
'>right-      repeater        -left<', //BECAUSE REPEATER ADDS NEXT
'                 v                 ', //WHEN IT PASSES TO DELAY,
'               done                ', //NEXT IS MUX'D INTO THE
'                 v                 '],//DONE->__ROOT__ path too~~
{
	//equivelent of calling "on",
    delay : function(s){
        s.data.chn.push("delay");
        setTimeout(s.flow.next.with(s.data), s.data.delay);
	},
    repeater : function(s){
        s.data.chn.push("repeater");
        s.data.count--;
        if(s.data.count >= 0){
            s.flow.next.emit(s.data);
        } else {
            s.flow.done.emit(s.data);
        }
    },
    log : function(s){
        s.data.chn.push("log");
        console.log(s.data.msg);
        s.flow[s.data.dir].emit(s.data);
    },
    lg : function(s){
        console.log(s.data.msg);
    }
},{
    debug:{
        graph : false,
        labeled_graph:false

    }
});



interleaver.on(function(s){
    console.log("all done with: ", s.data.msg);
})




interleaver.flow.right.emit({
    count:5,
    msg:"from the right",
    dir:"right",
    delay:200,
    chn:[]});

interleaver.flow.right.emit({
    count:10,
    msg:"from the right 2",
    dir:"right",
    delay:100,
    chn:[]});

interleaver.flow.left.emit({
    count:6,
    msg:"from the left",
    dir:"left",
    delay:700,
    chn:[]});
