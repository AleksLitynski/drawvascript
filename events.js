event_container = {
                into : [],
                with : function(parameter){
                                var parameterized_into = [];
                                for(var i = 0; i < this.into.length; i++){
                                                parameterized_into[i] = function(){
                                                                this.into[i](parameter);
                                                }
                                }
                                return parameterized_into;
                },
                add_event : function(name, event){
                                into[name] = event.emit;
                },
}

event = function(){
    var no_data = {};
    var data = this.no_data;
    var listener function(){};
    var self = {
        on : function(new_listener){
            listener = new_listener;
            if(data != no_data){
                listener(data);
            }
            return self;
        },
        emit : function(new_data){
            self.load(new_data);
            self.fire();
            return self;
        },
        with : function(new_data){
            data = new_data;
            return self;
        },
        fire : function(){
            if(data != no_data){
                (listener || function(){})(data);
            }
            return self;
        }
    }
    return self;
}



is_ready = new event



var evt = event();
evt.with("abc").fire;
evt.emit();




break event into monad components:
    return + bind + trigger
    emit = return + trigger
    on = bind

Then, have "on" do bind and something else do


continue.with("abc").into


continue.with("a").into


continue.into.dance("a")













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
