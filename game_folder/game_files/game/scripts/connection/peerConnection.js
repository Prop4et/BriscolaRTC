class PeerConnection extends Events.Connection{
    constructor(socket, player, is_initiator, ice_servers){
        super();
        
        this.socket = socket;
        this.peer_player = player;
        this.is_initiator = is_initiator;
        this.ice_servers = ice_servers;

        this.peer_connection = null;
        this.data_channel = null;
        this.data_channel_rdy = false;
        this.remote_description_rdy = false;
        this.pending_ice_candidates = [];

        this.peer_handlers = {};
        this.peer_handlers[Message.WEBRTC_ICE_CANDIDATE] = this.onLocalICECandidate;
        this.peer_handlers[Message.WEBRTC_ICE_STATE_CHANGE] = this.onICEConnectionStateChanged;
        this.peer_handlers[Message.WEBRTC_DATA_CHANNEL] = this.onDataChannel;

        this.data_channel_handlers = {};
        this.data_channel_handlers[Message.PEER_OPEN] = this.onDataChannelOpen;
        this.data_channel_handlers[Message.PEER_CLOSE] = this.onDataChannelClose;
        this.data_channel_handlers[Message.PEER_MESSAGE] = this.onDataChannelMessage;

        this.connect();
    }

    connect(){
        this.peer_connection = new RTCPeerConnection({
            iceServers: this.ice_servers
        });
        
        Events.listen(this.peer_connection, this.peer_handlers, this);
        if (this.is_initiator){
            this.openDataChannel(this.peer_connection.createDataChannel(DATA_CHANNEL_NAME,
                {
                    ordered: false
                })
            );
            this.sendSDPDescription();
        }
    }

    destroy(){
        // Close data channel
        this.data_channel.close();
        // Close peer connection
        if (this.peer_connection.signalingState !== "closed"){
            this.peer_connection.close();
        }
        Events.unlisten(this.data_channel, this.data_channel_handlers, this);
        Events.unlisten(this.peer_connection, this.peer_handlers, this);
    }

    setSDP(sdp){
        this.log("Got SDP from remote peer", "gray");
        var context = this;
        var rtc_descriprion = new RTCSessionDescription(sdp);
        context.peer_connection.setRemoteDescription(rtc_descriprion).then(() => {
            context.remote_description_rdy = true;

            while (context.pending_ice_candidates.length){
                context.addRemoteICECandidate(context.pending_ice_candidates.pop());
            }

            if (!context.is_initiator){
                context.sendSDPDescription();
            }
        });
    } 
    
    sendSDPDescription(){
        var context = this;
        context.getDescription().then((local_description) => {
            context.peer_connection.setLocalDescription(local_description).then(() => {
                context.log("Sending SDP", "green");
                context.sendSDP(context.peer_player.player_id, local_description);
            });
        }).catch(function (error){
            context.log("SDP Error: " + error.message, "red");
        });
    }

    sendSDP(player_id, sdp){
        this.socket.emit(Message.SDP, {
            player_id: player_id,
            sdp: sdp
        });
        this.log("Sent SDP to player with id " + player_id + " via server", "gray");
    }

    getDescription(){
        return this.is_initiator ?
        this.peer_connection.createOffer() :
        this.peer_connection.createAnswer();
    }

    addICECandidate(candidate){
        if (this.remote_description_rdy){
            this.addRemoteICECandidate(candidate);
        }
        else{
            this.pending_ice_candidates.push(candidate);
        }
    }
    addRemoteICECandidate(candidate){
        try{
            this.peer_connection.addIceCandidate(new RTCIceCandidate(candidate));
            this.log("Added ICE candidate: " + candidate.candidate, "gray");
        }catch (e){
            this.log("Error while adding remote ice candidate: " + e.message, "red");
        }
    }

    onLocalICECandidate(event){
        if (event.candidate){
            this.log("Send my ICE candidate: " + event.candidate.candidate, "gray");
            this.sendICECandidate(this.peer_player.player_id, event.candidate);
        }else{
            this.log("No more candidates", "gray");
        }
    }

    sendICECandidate(player_id, candidate){
        this.socket.emit(Message.ICE_CANDIDATE,
        {
            player_id: player_id,
            candidate: candidate
        });
    }

    onICEConnectionStateChanged(event){
        this.log("Connection state changed: " + event.target.iceConnectionState, "green");
    }

    onDataChannel(event){
        if (!this.is_initiator){
            this.openDataChannel(event.channel);
        }
    }

    openDataChannel(channel){
        this.data_channel = channel;

        Events.listen(this.data_channel, this.data_channel_handlers, this);
    }

    sendDataChannelMessage(message){
        if (!this.data_channel_rdy){
            this.log("Data channel is not ready", "red");
            return;
        }
        this.data_channel.send(message);
    }

    onDataChannelOpen(){
        this.data_channel_rdy = true;
        this.log("data channel open", "cyan");
        this.emit(Message.PEER_OPEN);
    }

    onDataChannelMessage(message){
        //this.log("data channel message", "cyan");
        this.emit(Message.PEER_MESSAGE, JSON.parse(message.data));
    }

    onDataChannelClose(){
        this.log("data channel close", "cyan");
        this.data_channel_rdy = false;
        //this.emit(Message.PEER_CLOSE);
    }

    log(message, color){
        console.log("%c PeerConnection[Player id: %d (%s), State: %s] %s", "color:" + color,
            this.peer_player.player_id,
            this.peer_player.player_name,
            this.peer_connection.signalingState,
            message);
    }
}