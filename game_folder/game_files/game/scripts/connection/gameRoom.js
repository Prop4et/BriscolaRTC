class GameRoom{
    constructor(server_url, room_name, player_name, token, btn_val){
        this.server_connection = new ServerConnection(server_url, room_name, player_name, token, btn_val);
        this.game = null;

        this.server_connection.on(Message.ROOM_JOINED, this.onJoinedRoom, this);

        this.server_connection.connect();

    }

    setReady(){
        this.server_connection.setReady();
    }

    onJoinedRoom(data){
        this.log("Joined the room. Creating Phaser game", "green");
        this.game = new Phaser.Game(GAME_CONFIG);
        var game_scene = new GameScene(SCENE_CONFIG, this);
        this.game.scene.add(START_SCENE_KEY, game_scene);
        this.game.scene.start(START_SCENE_KEY);
    }

    disconnect(){
        this.server_connection.disconnect();
        this.server_connection.destroy();
    }

    print(){
        this.server_connection.print();
    }

    log(message, color) {
        console.log("%c GameRoom: %s", "color:" + color, message);
    }
}