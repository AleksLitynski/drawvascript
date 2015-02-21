


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
