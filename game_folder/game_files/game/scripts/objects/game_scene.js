"use strict";
function tableCreate(mapPoints, mapNames, mapConnection, btn) {
    const div = document.getElementById('score_div');
    const tbl = document.createElement('table');
    tbl.className = "styled-table"
    tbl.style.width = '100%';
    //create the header
    var thead = tbl.createTHead();
    var row = thead.insertRow();
    var name = row.insertCell();
    var points = row.insertCell();
    var disconnected = row.insertCell();
    name.innerHTML = 'Player';
    points.innerHTML = 'Score';
    disconnected.innerHTML = 'State';
    tbl.appendChild(thead);

    //create the body
    var tbdy = document.createElement('tbody');
    var keyArr = Array.from(mapPoints.keys());
    for (let i = 0; i < keyArr.length; i++) {
        const tr = tbdy.insertRow();
        for (let j = 0; j < 3; j++) {
            const td = tr.insertCell();
            if(j == 0)
                td.appendChild(document.createTextNode(mapNames.get(keyArr[i])));
            if(j == 1)
                td.appendChild(document.createTextNode(mapPoints.get(keyArr[i])));
            if(j == 2)
                td.appendChild(document.createTextNode(mapConnection.get(keyArr[i])));
        }
    }
    //append all the children
    
    tbl.appendChild(tbdy);
    div.appendChild(tbl);
    div.appendChild(btn);
  }

class GameScene extends Phaser.Scene{
    constructor(config, game_room){
        console.log("game scene constructor");
        super(config);
        this.names = new Map();
        this.connection_state = new Map();
        this.my = {};
        this.my.game_room = game_room;
        this.my.connection = game_room.server_connection;
        this.my.player_id = game_room.server_connection.player_id;
        this.my.player_name = game_room.server_connection.player_name; 
        this.names.set(this.my.player_id, this.my.player_name);
        this.connection_state.set(this.my.player_id, 'connected');
        this.my.remote_players = {};
        this.my.connection_handlers = {};
        // Messages from peers
        this.my.connection_handlers[Message.PEER_OPEN] = this.onPeerOpen;
        this.my.connection_handlers[Message.PEER_CLOSE] = this.onPeerClose;
        this.my.connection_handlers[Message.PEER_MESSAGE] = this.onPeerMessage;

        // Messages from the room server
        this.my.connection_handlers[Message.PLAYER_JOIN] = this.onRemotePlayerJoin;

        //Messages from myself
        this.my.connection_handlers[Message.PLAYER_READY] = this.onPlayersReady;
        this.my.connection_handlers[Message.PICKING_ORDER] = this.onPickingOrder;

        //specific peer messages
        this.my.connection_handlers[InGameMessage.PULLED_CARDS] = this.onPulledCards;
        this.my.connection_handlers[InGameMessage.PULLED_CARD] = this.onPulledCard;
        this.my.connection_handlers[InGameMessage.CARD_PLAYED] = this.onCardPlayed;
    }

    preload(){
        //font
        this.plugins.get('rexwebfontloaderplugin').addToScene(this);
        var config = 
        {
            google: 
            {
                families: ['Roboto']
            }
        };
        this.load.rexWebFont(config);

        this.load.image('back', 'images/back.jpg');
        this.load.image('dealer', 'images/dealer.png')
        this.load.image('disconnected', 'images/disconnected.png');
        for(var i=0; i<40; i++){
            var x = i + 1;
            this.load.image(i.toString(), 'images/' + x.toString() +'.jpg');
        }

    }

    create() {
        Events.on(this.my.connection, this.my.connection_handlers, this);
        this.zone = new Zone(this, GAME_CONFIG.scale.width, GAME_CONFIG.scale.height);
        this.deck = new Deck(this, GAME_CONFIG.scale.width, GAME_CONFIG.scale.height);
        this.disconnectedLogo = [];
        const timerLabel = this.add.text(GAME_CONFIG.scale.width*0.8, GAME_CONFIG.scale.height*0.9, '60.00', {fontSize:48})
            .setOrigin(0.5);
        this.countDown = new CountDown(this, timerLabel);
        this.input.on('dragstart', function (pointer, gameObject) {
            gameObject.setTint(0xff69b4);
        });

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
            gameObject.x = dragX;
            gameObject.y = dragY;
    
        });

        this.input.on('dragend', this.onDragEnd);

        this.input.on('drop', function (pointer, gameObject, dropZone) {

            if(!this.scene.state.getIsDrawing()  && !this.scene.state.getPlayed(this.scene.my.player_id)){
                gameObject.disableInteractive();
            }
        });
        
    }

    update(){
        this.countDown.update();
    }

    restartButton(scene){
        const btn = document.createElement('button');
        btn.className =  "base-button rounded";
        btn.innerHTML = "Restart";
        btn.onclick = function(){
            scene.dealer.getSprite().destroy();
            scene.countDown.setLabel('60.00');
            scene.my.connection.setEndGame();
            scene.my.connection.restart();
            scene.zone.reset();
            scene.zone.paintZones(scene, GAME_CONFIG.scale.width, GAME_CONFIG.scale.height);
            scene.deck.resetCards();
            scene.deck = new Deck(scene, GAME_CONFIG.scale.width, GAME_CONFIG.scale.height)
            scene.state.resetState();
            for(var i in scene.disconnectedLogo)
                scene.disconnectedLogo[i].destroy();
            const div = document.getElementById('score_div');
            div.textContent = '';
        }
        return btn;
    }

    onDragEnd(pointer, gameObject, dropped){
        gameObject.setTint();
           
        if(!dropped || this.scene.state.getIsDrawing() || this.scene.state.getPlayed(this.scene.my.player_id)){
            gameObject.x = gameObject.input.dragStartX;
            gameObject.y = gameObject.input.dragStartY;
        }else{
            var msg = {
                type: InGameMessage.CARD_PLAYED,
                player_id: this.scene.my.player_id,
                card_played: gameObject.texture.key,
                index: gameObject.index
            }  
            //stops the timer after i play a card
            this.scene.countDown.stop();
            //sets things for computation and for animation
            this.scene.state.setPlayed(msg.player_id, msg.card_played);
            this.scene.deck.setPlayed(msg.player_id, msg.index);
            //increases the value of the current player
            this.scene.state.incCurrentCheckPlayed();
            //tells everyone i played a card
            this.scene.my.connection.broadcastMessage(msg);
            //if i'm the last to play then animation and all that follows
            var ret = this.scene.state.whoTakes();
            if(ret !== -1)
                setTimeout(() => {this.scene.cleanUp(ret)}, 1200);
        }
    }
    
    handleCDfinished(){
        this.my.connection.disconnect();
        alert('you have been disconnected');
        window.location = "/";
        //disconnect from everyone cause time's up
    }

    onPeerClose(player_info){
        //a peer disconnected, need to use the message cause the state wasn't reliable
        delete this.my.remote_players[player_info.player_id];

        this.my.connection.removePeer(player_info.player_id);
        this.log('peer with id: ' + player_info.player_id + ' disconnected', 'purple');
        this.connection_state.set(player_info.player_id, 'disconnected');
        //peer may disconnect while playing or while drawing
        if(!this.my.connection.start)
            return;
        if(this.remoteSize() === 0){
            this.countDown.stop();
            tableCreate(this.state.getOrderedPoints(), this.names, this.connection_state, this.restartButton(this))

            return;
        }
        if(this.state.getIsDrawing()){
            //if the disconnected id comes before me i need to know who is the first that needs to restart the chain of drawing
            console.log('player disconnected during drawing phase', this.state.getCurrent());
            if(this.state.isPrevId(player_info.player_id)){
                this.state.setCountPlayed(3);
            }else{
                this.state.setCountPlayed(this.state.getCardsInHand());
            }
            this.state.removePlayer(player_info.player_id);
        } else{ //if not drawing i handle it as done till now
            this.state.pushDisconnected(player_info.player_id);
            if(this.state.setPlayed(player_info.player_id, -1)){
                this.state.incCurrentCheckPlayed();
                if(this.state.getDealer() === player_info.player_id){
                    var position = this.state.getDirectionRelativeToId(this.my.player_id, this.state.getCurrent());
                    this.dealer.animate(position);
                }
            }
        }
        if(this.state.getCurrent() ===  this.my.player_id)
            this.countDown.start(this.handleCDfinished.bind(this));
        var position = this.state.getDirectionRelativeToId(this.my.player_id, player_info.player_id);
        this.disconnectedLogo.push(new Disconnected(this, position));
    }

    onRemotePlayerJoin(data){
        if(!this.my.remote_players[data.player.player_id]){
            this.my.remote_players[data.player.player_id] = data;
            this.names.set(data.player.player_id, data.player.player_name);
            this.connection_state.set(data.player.player_id, 'connected');
        }
    }

    onPlayersReady(data){
        //all the players are ready
        var app = [];
        for(var k in this.my.remote_players){
            app.push(parseInt(this.my.remote_players[k].player.player_id));
        }
        app.push(this.my.player_id);
        app = app.sort();
        this.state = new State(app);
        

        //TODO:here i could show the name under the positions of each player
        var starter_list = [];
        for(var i = 0; i < LIST_LEN; i++){
            starter_list.push(Math.floor(Math.random() * data.size));
        }
        var suit_list = new Array(4).fill(0);
        for(var i = 0; i<100; i++){
            suit_list[Math.floor(Math.random() * 4)] += 1;
        }
        var value_list = new Array(BRISCOLA_LEN).fill(0);
        for(var i = 0; i<100; i++){
            value_list[Math.floor(Math.random() * 10)] += 1;
        }
        
        this.state.pushStructures(this.my.player_id, starter_list, value_list, suit_list);

        //send my list to everyone else
        this.log('auto initialization done', 'purple');
        var msg = {
            type: Message.PICKING_ORDER,
            player_id: this.my.player_id,
            starter_list: starter_list,
            suit_list: suit_list,
            value_list: value_list,
        };

        this.my.connection.broadcastMessage(msg);
    }

    async onPickingOrder(data){
        //received someone else's list, save it, if someone's missing i wait
        if(!this.state.pushStructures(data.player_id, data.starter_list, data.value_list, data.suit_list, this.remoteSize()))
            return;
        //select who is the starting player
        this.state.pickId();
        //select what the briscola should be
        var briscola = this.state.pickBriscola();
        //in case players number is odd with respect to the number of cards
        var to_remove = this.state.removeFromDeckDisconnected();
        if(to_remove || to_remove.length !== 0)
            await this.deck.removeDisconnection(to_remove);
        this.log('starting id: ' + this.state.getDealer(), 'green');
        this.log('briscola: ' + this.state.getBriscola(), 'green');
        //animate the briscola
        this.deck.animateBriscola(briscola);
        //if i'm the dealer i have to select the cards to get
        var position = this.state.getDirectionRelativeToId(this.my.player_id, this.state.getDealer());
        this.dealer = new Dealer(this, GAME_CONFIG.scale.width, GAME_CONFIG.scale.height, position);
        this.pullCards();
    }

    pullCards(){
        //beginning dealer and current are the same
        if(this.state.getCurrent() !==  this.my.player_id)
            return;
        var pulled_cards = this.state.pullThreeFromDeck();
        this.zone.getNamezone().get('bot').setText(this.my.player_name);
        var msg = {
            type: InGameMessage.PULLED_CARDS,
            player_id:  this.my.player_id,
            pulled_cards: pulled_cards, 
            player_name: this.my.player_name,
        } 

        //this.log('pulled from deck: ' + pulled_cards, 'purple');
        this.my.connection.broadcastMessage(msg)
        this.deck.giveCards('bot', pulled_cards, this.state.getCurrent());
        if(this.state.getNext())
            this.pullCards()
        else{
            this.state.resetCurrent();
            this.state.resetIsDrawing();
            if(this.state.getDealer() ===  this.my.player_id)
                this.countDown.start(this.handleCDfinished.bind(this));
        }
    }

    async pullCard(){
        if(this.state.getCurrent() !== this.my.player_id)
            return;
        
        var pulled_card = this.state.pullFromDeck();
        var msg = {
            type: InGameMessage.PULLED_CARD,
            player_id: this.state.getCurrent(),
            pulled_card: pulled_card, 
            player_name: this.my.player_name,
        } 
        //this.log('pulled from deck: ' + pulled_card, 'purple');
        this.my.connection.broadcastMessage(msg)
        await this.deck.giveCard('bot', this.state.getCurrent(), pulled_card);
        if(this.state.getNext())
            this.pullCard()
        else{
            this.state.resetCurrent();
            this.state.resetIsDrawing();
            if(this.state.getDealer() ===  this.my.player_id)
                this.countDown.start(this.handleCDfinished.bind(this));
        }
    }

    onPulledCards(data){
        //cards have been taken from the deck, it could be sent by myself too        
        //this.log('received message from: ' + data.player_id + ' pulled: ' + data.pulled_cards, 'purple');
        //if message is sent by myself this function doesn't actually do anything
        this.state.removeFromDeckList(data.pulled_cards);
        var position = this.state.getDirectionRelativeToId(this.my.player_id, data.player_id);
        this.deck.giveCards(position, [], data.player_id);
        //TODO: fix the name position by making them staying in the middle, like by dividing equally the number of letters idk
        this.zone.getNamezone().get(position).setText(data.player_name);
        //getting who is the next one that needs to pull cards from the deck, if false everyone has pulled //TODO: should i switch state between playing and pulling?
        if(this.state.getNext())
            this.pullCards()
        else{
            this.state.resetCurrent();
            this.state.resetIsDrawing();
            if(this.state.getDealer() ===  this.my.player_id)
                this.countDown.start(this.handleCDfinished.bind(this));
        }
    }

    async onPulledCard(data){
        //if message is sent by myself this function doesn't actually do anything
        this.state.removeFromDeck(data.pulled_card);
        var position = this.state.getDirectionRelativeToId(this.my.player_id, data.player_id);
        await this.deck.giveCard(position, data.player_id, null);
        //getting who is the next one that needs to pull cards from the deck, if false everyone has pulled //TODO: should i switch state between playing and pulling?
        if(this.state.getNext())
            this.pullCard()
        else{
            this.state.resetCurrent();
            this.state.resetIsDrawing();
            if(this.state.getDealer() ===  this.my.player_id)
                this.countDown.start(this.handleCDfinished.bind(this));
        }
    }

    onCardPlayed(data){
        //someone played a card, need to increment the current player if the right player did so
        this.state.setPlayed(data.player_id, data.card_played)
        this.deck.animatePlayedCard(data.player_id, data.card_played, data.index);

        var ret = this.state.whoTakes();
        if(ret !== -1){
            setTimeout(() => {this.cleanUp(ret)}, 1200);
        }
        else{
            //if it's the player previous to me and everyone played and order is respected
            if(this.state.getCurrent() === data.player_id){
                this.state.incCurrentCheckPlayed();
                if(this.state.getCurrent() === this.my.player_id)
                    this.countDown.start(this.handleCDfinished.bind(this));
            }
        }
            
    }

    async cleanUp(v){
        //not all the players have played
        this.countDown.setLabel('60.00');
        await this.deck.cardsTakenBy(v);
        var removed = this.state.removeFromDeckDisconnected();
        if(removed && removed.length > 0)
            await this.deck.removeDisconnection(removed);
        if(this.state.getCountPlayed() === 40){
            //entire map, maybe u want to show this idk
            this.my.connection.setPointsShown(true);
            tableCreate(this.state.getOrderedPoints(), this.names, this.connection_state, this.restartButton(this))
            this.my.connection.setEndGame();
            return;
        }
        //animate button moving to whoever took
        var position = this.state.getDirectionRelativeToId(this.my.player_id, this.state.getDealer());
        await this.dealer.animate(position);
        this.pullCard();  
    }

    remoteSize(){
        return Object.keys(this.my.remote_players).length;
    }

    log(message, color) {
        console.log("%c GameScene: %s", "color:" + color, message);
    }
}

