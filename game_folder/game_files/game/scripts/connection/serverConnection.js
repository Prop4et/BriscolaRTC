class ServerConnection extends Events.Connection{
    constructor(server_url, room_name, player_name,  btn_val){
        super();
        this.room_name = room_name;
        this.player_name = player_name;
		this.player_ready = 0;
		this.start = false;
		this.btn_val = btn_val;
        this.player_id = null;
		this.points_shown = false;

        this.socket = io(server_url);
        this.room_info = null;

        this.peer_connections = {};
        this.pending_sdps = {};
        this.pending_ice_candidates = {};

        this.handlers = {};
        this.handlers[Message.ROOM_INFO] = this.onRoomInfo;

        this.handlers[Message.PLAYER_JOIN] = this.onPlayerJoin;
        this.handlers[Message.PLAYER_LEAVE] = this.onPlayerLeave;

        this.handlers[Message.SDP] = this.onSdp;
        this.handlers[Message.ICE_CANDIDATE] = this.onICECandidate;

		this.handlers[Message.ERROR_ROOM_EXIST] = this.onRoomExist;
        this.handlers[Message.ERROR_FULL_ROOM] = this.onFullRoom;
		this.handlers[Message.ERROR_PLAYER_WAS_INITIALIZED] = this.onPlayerWasInitialized;
		this.handlers[Message.ERROR_ROOM_NOEXIST] = this.onRoomNoExist;
		this.handlers[Message.ERROR_GAME_STARTED] = this.onGameStarted;


        Events.on(this.socket, this.handlers, this);

        this.peer_handlers = {};
	    this.peer_handlers[Message.PEER_OPEN] = this.onPeerChannelOpen;
	    this.peer_handlers[Message.PEER_CLOSE] = this.onPeerChannelClose;
	    this.peer_handlers[Message.PEER_MESSAGE] = this.onPeerMessage;

    }

    destroy(){
    	Events.off(this.socket, this.handlers, this);
	}

    connect(){
		this.log('socket connected', 'gray');
		this.socket.emit(Message.ROOM_JOIN, {
			room_name: this.room_name,
			player_name: this.player_name,
			flag_create: this.btn_val
		});
		
	}

    disconnect(){
    	this.socket.emit(Message.ROOM_LEAVE);
		for (var peer_id in this.peer_connections) {
            this.sendMessageTo(peer_id, {
				type: Message.PEER_CLOSE,
				player_id: this.player_id
			});
			this.removePeer(peer_id);
			//this.peer_connections[peer_id].destroy();
	    }
		this.peer_connections = {};
		this.destroy();
	}

	removePeer(peer_id){
		this.peer_connections[peer_id].destroy();
		delete this.peer_connections[peer_id];
	}

	print(){
		console.log('peer_connections: ', this.peer_connections)
		for(var p in this.peer_connections){
			console.log('p', p)
			console.log('peer_connections[p]', this.peer_connections[p]);
		}
	}

    //this comes after a join
    onRoomInfo(data){
		this.log("OnRoomInfo", "cyan");
        this.room_info = data;
        this.player_id = this.room_info.player_id;
		this.emit(Message.ROOM_JOINED, data);
        //start to create a peer connection for each other player inside the room
        for(var p in this.room_info.players){
            var player = this.room_info.players[p];
            if(player.player_id !== this.player_id){
                //we are initiating the connection, is_initiating = true
                this.peer_connections[player.player_id] = this.createPeerConnection(player, true);
            }
        }
		
		this.room_size = data.size;
    }

    onPlayerJoin(data){
		document.getElementById('start_game').className = "base-button rounded hide";
		this.log("Player with id " + data.player_id + " joined the room", "green");
		const player_data =  {
			player_id: data.player_id,
			player_name: data.player_name
		}
		if(this.player_name === data.player_name)
			return;
		this.room_info.players.push(player_data);
        //a player has joined the room in which we already were, we are not initiating
		this.peer_connections[data.player_id] = this.createPeerConnection(player_data, false);
		this.room_size = data.size;
	}

	createPeerConnection(peer_player, is_initiator) {
		var peer_connection = new PeerConnection(this.socket, peer_player, is_initiator, ICE_SERVERS);
    	Events.on(peer_connection, this.peer_handlers, this, peer_connection, peer_player);

    	// Handle pending SDP
	    var pending_sdp = this.pending_sdps[peer_player.player_id];
	    if (pending_sdp){
            peer_connection.setSDP(pending_sdp);
            delete this.pending_sdps[peer_player.player_id];
	    }

	    // Handle all pending ICE candidates
	    var pending_ice_candidate_list = this.pending_ice_candidates[peer_player.player_id];
	    if (pending_ice_candidate_list) {
            pending_ice_candidate_list.forEach(peer_connection.addICECandidate, peer_connection);
            delete this.pending_ice_candidates[peer_player.player_id];
	    }

	    return peer_connection;
	}

    onPlayerLeave(data){
		this.log("Player with id " + data.player_id + " left the room", "cyan");
		this.room_size = data.size;
		
		if(!this.start && !this.points_shown){
			this.resetStart();
			return;
		}
	}

    onSdp(data){
		this.log("Received SDP from player with id " + data.player_id, "green");

		// If we don"t yet have this player as a peer
	    if (!this.peer_connections[data.player_id]){
            this.log("Adding pending SDP from player with id " + data.player_id, "gray");
            this.pending_sdps[data.player_id] = data.sdp;
	    }
	    else{
	    	this.peer_connections[data.player_id].setSDP(data.sdp);
	    }
	}

    onICECandidate(data){
		this.log("ICE candidate received from player with id" + data.player_id, "green");
		
		// If we don't yet have this player as a peer
	    if (!this.peer_connections[data.player_id]){
            this.log("Adding pending ICE candidate from player with id " + data.player_id, "gray");
            if (!this.pending_ice_candidates[data.player_id]){
                this.pending_ice_candidates[data.player_id] = [];
            }
            this.pending_ice_candidates[data.player_id].push(data.candidate);
	    }
	    else{
	    	this.peer_connections[data.player_id].addICECandidate(data.candidate);
	    }
	}

    onFullRoom(data){
		this.log("Full room", "red");
	}

    onPlayerWasInitialized(data){
		this.log("Player was initialized", "red");
	}

	onRoomExist(data){
		this.log("Room exist, game still going on", "red");
		var player_title = document.getElementById('player_title');
		document.getElementById('start_game').disabled = true;
		document.getElementById('start_game').className = "base-button rounded";
		player_title.innerHTML = "Game already started, join later";
		setTimeout(() => {  window.location = "/"; }, 2000);
	}

	onRoomNoExist(data){
		this.log("Room doesn't exist", "red");
	}

	onGameStarted(data){
		this.log("Game started, wait for it to end", "red");
	}

    onPeerChannelOpen(peer_player, player){
    	this.emit(Message.PEER_OPEN, player, peer_player);
		setTimeout( () => this.resetStart(), 1000);
  	}

    onPeerChannelClose(peer_player, player){
		this.log('peer channel close', 'cyan' );
	    this.emit(Message.PEER_CLOSE, player, peer_player);
	}

    onPeerMessage(peer_player, player, message){
		if(message.type === Message.PLAYER_READY){
            //information is acceptable
			this.emit(Message.PLAYER_JOIN, {player: player});
            if(this.room_size === message.size){
                this.player_ready += 1;
				if(this.player_ready < message.ready)
					this.player_ready = message.ready;
                if(this.player_ready === this.room_size){
					document.getElementById("spin").style.visibility = "hidden";
					document.getElementById("spin_text").style.visibility = "hidden";

					this.log("all players ready","cyan");
                    this.socket.emit(Message.GAME_STARTED);
					this.start = true;
					this.emit(Message.PLAYER_READY, {
						player_id : this.player_id,
						size: this.room_size
					});
					this.setStart();
				}
                //if different it's resetted so we're good
            }
		}else{
    		this.emit(message.type, message, player, peer_player);
		}
    }

    broadcastMessage(message){
    	for (var peer_id in this.peer_connections) {
            this.sendMessageTo(peer_id, message);
	    }
  	}

    sendMessageTo(peer_id, message) {
	    this.peer_connections[peer_id].sendDataChannelMessage(JSON.stringify(message));
	}

	setReady(){
		if(this.room_size < 2){
			alert('cannot start a game alone');
			return;
		}
		document.getElementById("spin").style.visibility = "visible";
		document.getElementById("spin_text").style.visibility = "visible";


		this.setStart();

		this.player_ready += 1;
		var msg = {
			type: Message.PLAYER_READY,
			player_id: this.player_id,
			player_name: this.player_name,
			size: this.room_size,
			ready: this.player_ready,
		};
		this.broadcastMessage(msg);
		document.getElementById('player_title').innerHTML = "Waiting for all the players to be ready"
		if(this.player_ready === this.room_size){
			this.log("all players ready","cyan");
			this.socket.emit(Message.GAME_STARTED);
			this.start = true;
			this.emit(Message.PLAYER_READY, {
				player_id : this.player_id,
				size: this.room_size
			});
		document.getElementById("spin").style.visibility = "hidden";
		document.getElementById("spin_text").style.visibility = "hidden";

		this.setStart();
		}
	}

	setPointsShown(b) {
		this.points_shown = b;
	}

	setEndGame(){
		this.log("Game has ended","cyan");
		this.socket.emit(Message.GAME_ENDED);
		this.start = false;
		this.player_ready = 0;
	}

    log(message, color){
    	console.log("%c ServerConnection: %s", "color:" + color, message);
  	}


	resetStart(){
		this.setEndGame();
		this.player_ready = 0;
		var player_title = document.getElementById('player_title');
		var start_game = document.getElementById("start_game");

		
		if(this.room_size > 1){
			player_title.innerHTML = "Start game with " + this.room_size  + " players?";
			document.getElementById("spin").style.visibility = "hidden";
			document.getElementById("spin_text").style.visibility = "hidden";

			start_game.disabled = false;
			start_game.innerHTML = "Start";
			document.getElementById("player_div").className = "game-start show";
			player_title.className = "start-message show";
			start_game.className = "base-button rounded";
		}else{
			this.setStart();
			document.getElementById("spin").style.visibility = "visible";
			document.getElementById("spin_text").style.visibility = "visible";

		}


	}

	setStart(){
		document.getElementById('start_game').disabled = true;
		document.getElementById('player_div').className = "game-start";
		document.getElementById('player_title').className = "start-message";
		document.getElementById('start_game').className = "base-button rounded hide";
	}
}