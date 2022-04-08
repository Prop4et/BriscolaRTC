var user_input = document.getElementById('username');
var room_input = document.getElementById('room_name');
var join_btn = document.getElementById('join_btn');
var new_room_btn = document.getElementById('new_room_btn');

var data = null;

var socket = io(SERVER_URL);

socket.on(Message.ROOM_LIST, onRoomList);

function cleanUp(username, room_name){
    console.log(username);
    if(username.length === 0){
        alert('You must insert a username');
        return 0;
    }

    if(room_name.length === 0){
        alert('You must insert a room id');
        return 0;
    }
    return 1;
}

function createQuery(username, room_name, btn_val){
    var query = '?room_name=' + room_name;
    query += '&player_name=' + username;
    query += '&btn_val=' + btn_val;
    return query;
}

function checkRoom(room_name){
    //there are no rooms, can't join
    if(!data)
        return false;
    //selected room is not alive
    if (Object.keys(data.room_player_names).indexOf(room_name) === -1)
        return false;
    return true
}

function checkName(username, room_name) {
    //true if username already taken, so return false
    return !data.room_player_names[room_name].includes(username);
}

new_room_btn.onclick = function(){
    var username = user_input.value.trim();
    var room_name = room_input.value.trim();
    if(!cleanUp(username, room_name)){
        return;
    }

    //name is always unique, so this isn't needed too
    if(checkRoom(room_name)){
        alert('room already exist');
        return;
    }
    //checkName not needed if we are creating a new room
    window.location = GAME_PATH + createQuery(username, room_name, true); 
    return;
}

function onRoomList(msg){
    data = msg;
    console.log(data);
    const div = document.getElementById('table_div');
    div.textContent = '';
    const tbl = document.createElement('table');
    tbl.className = "room-table"
    var tbdy = document.createElement('tbody');

    var room_names = Object.keys(data.room_player_names);
    var i = 0;
    var tr;
    room_names.forEach(function(room_name) {
        if(i % 3 === 0)
           tr = tbdy.insertRow();
		var room_players = data.room_player_names[room_name];
        const td = tr.insertCell();
		var room_item = document.createElement('div');
        
		var room_title = room_name;
		var width = (room_players.length / ROOM_CAPACITY)*100;
		var room_item_content = "<div class='room-capacity'><div class='room-title'> Room Name: " + room_title;
		room_item_content += "</div><div class='room-current-capacity' style='width: " + width + "%'></div></div>";

		room_item_content += "<div class='room-players'> Players:";
        var j = 0;
		room_players.forEach(function(room_player_name)
		{
			room_item_content+= "<div class='room-player'>" + room_player_name + "</div>";
            j++;
		}); 
        while(j<ROOM_CAPACITY){
            room_item_content+= "<div class='room-player'> - </div>";
            j++;
        }
		room_item_content += "</div>";

		room_item.innerHTML = room_item_content;

        room_item.onclick = function() {
            var username = user_input.value.trim();
            if(!cleanUp(username, room_name)){
                return;
            }

            if(!checkName(username, room_name)){
                alert('username already taken in this room');
                return;
            }
            window.location = GAME_PATH + createQuery(username, room_name, false); 
            return;
        }

    	td.appendChild(room_item);
        i++;
	});

    while(i % 3 !== 0){
        const td = tr.insertCell();
		var room_item = document.createElement('div');
        td.appendChild(room_item);
        i++;
    }

    tbl.appendChild(tbdy);
    div.appendChild(tbl);

}

socket.emit(Message.GET_ROOM_LIST);
