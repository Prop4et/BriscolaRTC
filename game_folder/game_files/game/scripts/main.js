const START_IMMEDIATELY = true;

// Extract player input
const query_params = new URLSearchParams(window.location.search);
const room_name = query_params.get('room_name');
const player_name = query_params.get('player_name');
const btn_val = query_params.get('btn_val');
const token = query_params.get('token');


//variables
var created_game_room = false;

var start_game = document.getElementById("start_game");
var game_room;

loadedModels();

function loadedModels() {
    showGame();
    document.getElementById('room_name_row').innerHTML = room_name;
}


function initiateRoom(){
    //things to do on start
    
    if(!created_game_room){
        created_game_room = true;
        game_room = new GameRoom(SERVER_URL, room_name, player_name, token, btn_val);
        start_game.onclick = function(){
            game_room.setReady();
        }
        document.addEventListener("visibilitychange", (event) => {
            if (document.visibilityState != "visible") {
                game_room.disconnect();
                alert('lost page focus, disconnecting');
                window.location = "/";
            } 
        });
        window.onbeforeunload = function(e) 
        {
            /*var message = "Are you sure you want to leave?";
            e = e || window.event;
            if(e)
                e.returnValue = message;*/
            game_room.disconnect();
            //return message;
        };
        
    }
}

function disconnect(){
    game_room.disconnect();
}

function print(){
    game_room.print();
}


function showGame() {
    initiateRoom();    
}



