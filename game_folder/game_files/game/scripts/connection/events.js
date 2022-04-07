class Connection{
    constructor(){
        this.last_event_id = 0;
        this.events = {};
    }

    destroy(){
        this.events = null;
    }

    emit(event_name){
        var emit_arguments = [].slice.call(arguments, 1);
        for(var i in this.events){
            var event = this.events[i];
            if(event.event_name === event_name){
                event.handler.apply(event.context, emit_arguments);
            }
        }
    }

    on(event_name, handler, context){
        var event_id = ++this.last_event_id;
        this.events[event_id] = {
            event_name: event_name,
            handler: handler,
            context: context
        };
        return event_id;
    }

    off(event_id){
        delete this.events[event_id];
    }
}

Events = {
    Connection: Connection,
    listen: function(){
        this._listen("addEventListener", arguments);
    },

    unlisten: function(){
        this._unlisten("removeEventListener", arguments);
    }, 

    on: function(){
        this._listen("on", arguments);
    },

    off: function(){
        this._unlisten("off", arguments);
    },

    _listen: function(method, args){
        var args = [].slice.apply(args);
        var obj = args[0];
        var handlers = args[1];
        var context = args[2];
        var bindArgs = args.slice(2);
        for(var k in handlers){
            var bound = context[k + "_bound"] = handlers[k].bind.apply(handlers[k], bindArgs);
            obj[method](k, bound);
        }
    },

    _unlisten: function(method, args){
        var args = [].slice.apply(args);
        var obj = args[0];
        var handlers = args[1];
        var context = args[2];
        for(var k in handlers){
            obj[method](k, context[k + "_bound"]);
        }
    }
};