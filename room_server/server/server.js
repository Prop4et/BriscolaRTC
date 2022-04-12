var log = console.log.bind(console);
var config = require('./config');

const https = require('https');

var fs = require('fs');

//then certificates should be handled i think
var options = 
{
	requestCert: false,
	rejectUnauthorized: false
};

options["cert"] = fs.readFileSync("./certificates/certbot/conf/live/localhost/fullchain.pem");
options["key"] = fs.readFileSync("./certificates/certbot/conf/live/localhost/privkey.pem");

var server = https.createServer(options);
server.listen(config.ROOM_SERVER_PORT);

var io = require('socket.io')(server, { 
    cors:
    {
        origin: '*'
    }
});

var rooms = {};
var sockets = [];

var Message = {
    GET_ROOM_LIST: 'get_room_list',
    ROOM_LIST: 'room_list',

    ROOM_JOIN: 'room_join',
    ROOM_LEAVE: 'room_leave',
    ROOM_INFO: 'room_info',

    GAME_STARTED: 'game_started',
    GAME_ENDED: 'game_ended',

    PLAYER_JOIN: 'player_join',
    PLAYER_READY: 'player_ready', 
    PLAYER_LEAVE: 'player_leave',

    SDP: 'sdp', 
    ICE_CANDIDATE: 'ice_candidate',

    ERROR_FULL_ROOM: 'error_full_room',
    ERROR_USER_INIT: 'error_user_init',
    ERROR_ROOM_EXIST: 'error_room_exists',
    ERROR_ROOM_NOEXIST: 'error_room_no_exist',
    ERROR_GAME_STARTED: 'error_game_started'
};

class Player{
    constructor(player_id, player_name, token){
        this.player_id = player_id;
        this.player_name = player_name;
        this.token = token;
    }

    getId(){
        return this.player_id;
    }

    getName(){
        return this.player_name;
    }

    getToken(){
		return this.token;
	}

    getInfoMsg(){
        const msg = {
            player_id: this.getId(),
            player_name: this.getName(),
        }
        return msg;
    }
}

class Room{
    constructor(room_name){
        log('creating a new room')
        this.last_user_id = 0;
        //gives the game order when players join the room, then it's handled internally
        this.room_name = room_name;
        this.players = [];
        this.sockets = [];
        this.started = false;
    }

    getName(){
        return this.room_name;
    }

    getPlayers(){
        return this.players;
    }

    getPlayerById(player_id){
        return this.players.find( (player) => {
            return player.getId() === player_id;
        });
    }

    getStarted(){
        return this.started;
    }

    getLastUserId(){
        return this.last_user_id
    }

    incUserId(){
        this.last_user_id += 1;
    }

    setStarted(){
        this.started = true;
    }

    unsetStarted(){
        this.started = false;
    }

    size(){
        return this.players.length;
    }

    isEmpty(){
        return this.players.length === 0;
    }

    addPlayer(player, socket){
        this.players.push(player);
        this.sockets.push(socket);
    }

    removePlayer(player_id){
        this.players = this.players.filter( (player) =>{
            return player.getId() !== player_id;
        });
        delete this.sockets[player_id];
    }

    messageToPlayer(player_id, message_type, data){
        if(this.sockets[player_id]){
            this.sockets[player_id].emit(message_type, data);
        }
    }

    messageBroadcast(from_player_id, message_type, data){
        this.players.forEach( (player) => {
            var curr_player_id = player.getId();
            if(curr_player_id !== from_player_id){
                this.messageToPlayer(curr_player_id, message_type, data);
            }
        }, this);
    }
}

function generateRoomPlayerNames(){
    var result = {};
	for (var room_name in rooms) {
		var player_names = [];
		rooms[room_name].getPlayers().forEach( (player) => {
    		player_names.push(player.getName());
		});
		result[room_name] = player_names;
	}
	return result;
}

function handleConnection(socket){
    var player = null;
    var room = null;
    sockets.push(socket);
    socket.on(Message.GET_ROOM_LIST, onGetRoomList);

    socket.on(Message.ROOM_JOIN, onRoomJoin);

    socket.on(Message.GAME_STARTED, onGameStarted);
    socket.on(Message.GAME_ENDED, onGameEnded);

    socket.on(Message.SDP, onSdp);
    socket.on(Message.ICE_CANDIDATE, onIceCandidate);

    socket.on('disconnect', handleDisconnection);

    function onGetRoomList(){
        log('requested: Room List');
        socket.emit(Message.ROOM_LIST, {
            room_player_names: generateRoomPlayerNames()
        });
    }

    function onGameStarted(data){
        room.setStarted();
    }

    function onGameEnded(data){
        room.unsetStarted();
    }
    function onRoomJoin(data){
        //if already handling the user 
        if(player !== null || room !== null){
            room.messageToPlayer(player.getId(), 
                Message.ERROR_USER_INIT,
                {}
            );
            return;
        }
        //otherwise
        room = getRoom(data.room_name, data.flag_create);
        if(room === null){
            socket.emit(Message.ERROR_ROOM_NOEXIST, {});
            return;
        }

        if(room.getStarted()){
            log('room started, cannot join');
            socket.emit(Message.ERROR_ROOM_EXIST, {});
            return;
        }

        if(room.size() >= config.ROOM_CAPACITY){
            socket.emit(Message.ERROR_FULL_ROOM, {});
            return;
        }

        player = new Player(room.getLastUserId(), data.player_name, data.token);
        room.incUserId();
        room.addPlayer(player, socket);
        log('joined a room, sending [%s] to %s', room.getName(), player.getId());
        room.messageToPlayer(player.getId(), 
            Message.ROOM_INFO, {
                player_id: player.getId(),
                room_name: room.getName(), 
                players: room.getPlayers(),
                size: room.size()
            }
        );

        room.messageBroadcast(player.getId(), Message.PLAYER_JOIN, {
            player_id: player.getId(),
            player_name: player.getName(),
            size: room.size()
        });

        for(var socket_id in sockets){
            sockets[socket_id].emit(Message.ROOM_LIST, {
                room_player_names: generateRoomPlayerNames()
            });
        }
        log('Player %d [%s] joined the room %s', player.getId(), player.getName(), room.getName())
    }

    function getRoom(room_name, flag_create){
        if(!rooms[room_name]){
            if (!room_name){
                return null;
            }
            if(!flag_create){
                return null;
            }
            else{
                rooms[room_name] = new Room(room_name);
                log('created a new room');
            }
        }
        return rooms[room_name];
    }

    function handleDisconnection(){
        //remove the disconnected socket, i don't need to send it anything anymore
        sockets = sockets.filter(socket => socket.disconnected === false);
        
        if(room === null){
            return;
        }

        if(!player)
            return;

        if(room.getPlayerById(player.getId()) === undefined)
            return;

        room.removePlayer(player.getId());
        log('Removed player %d %s, room size is %d ', player.getId(), player.getName(), room.size());

        if(room.isEmpty()){
            log('Room is empty, deleting %s', room.getName());
            delete rooms[room.getName()];
        }

        for(var socket_id in sockets){
            sockets[socket_id].emit(Message.ROOM_LIST, {
                room_player_names: generateRoomPlayerNames()
            });
        }

        room.messageBroadcast(player.getId(), 
            Message.PLAYER_LEAVE, {
                player_id: player.getId(),
                size: room.size()
            });
    }

    function onSdp(data){
        log('sdp request from %s to %s', player.getId(), data.player_id);

        room.messageToPlayer(data.player_id,
            Message.SDP,
            {
                player_id: player.getId(), 
                sdp: data.sdp
            }
        );
    }

    function onIceCandidate(data){
        log('Ice candidate request from %s to %s', player.getId(), data.player_id);

        room.messageToPlayer(data.player_id,
            Message.ICE_CANDIDATE,
            {
                player_id: player.getId(),
                candidate: data.candidate
            }
        );
    }
}

io.on('connection', handleConnection);

log('I am running room server on port %d', config.ROOM_SERVER_PORT);