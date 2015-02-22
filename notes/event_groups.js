/*


    1---+         +--4
    2---+->--a- >-+----5
    3---+         +------6


event_group
- list of out events
- control function //<- control function for root starts off as blank. Feel free to put anything you like in there, or just start calling events.
- inbound data



optional parameter for graph state and node state



event_node = {
    input:"xyz",
    state:{abc:"def"},
    transform:function(){},
    events:{path:event, path2:event2}
}

event_graph = {
    state:{},
    root:event_node,
    event_nodes:[]
}

event = {
    on : func,
    data : {},
    emit,fire,with
}



event_node = {
    inbound_event: event(),
    outbound_events: [event()]
}
*/




event = function(){
    var no_data = {};
    var data = no_data;
    var listeners = [];
    function fireListener(listener, current_data){
        setTimeout(function(){
            listener(current_data);
        }, 0)
    }
    var self = {
        on : function(new_listener){
            listeners[listeners.length] = new_listener;
            if(data != no_data){
                fireListener(new_listener, data);
            }
            return self;
        },
        emit : function(new_data){
            self.with(new_data).fire();
            return self;
        },
        with : function(new_data){
            data = new_data;
            return self;
        },
		fire : function(){
            if(data != no_data){
				for(var index in listeners){
                    fireListener(listeners[index], data);
				}
            }
            return self;
        }
    }
    return self;
}

var evt = event();
evt.emit({woob:"wab"})
evt.on(function(data){console.log("1", data);})
evt.on(function(data){console.log("2", data);})
evt.emit("hey one");
evt.emit({woob:"choob"})
evt.with("hey").fire();
