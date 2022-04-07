"use strict";
//Handling disconnection after the ready phase will be a pain in the ass
class State{
    #dealer = -1;
    #dealer_pos = -1;
    #current = -1; //used to decide who is the current player to pull a new card
    #dealer_plus = 0; //position of the player that is receiving the cards in that moment
    #players_id; //array of all the ids
    #direction_id; //used to keep directions even in case of disconnection
    #n_players;
    #cards_in_deck = Array.from({length: 40}, (_, i) => i); //cards still to be played
    #count_played = 0;
    #cards_in_hand = 0;
    #is_drawing = false;
    #played = new Map();
    #briscola = -1;
    #briscola_suit = -1;
    #points = new Map();
    #removed = [];
    #disconnected = [];
    //things to create the starting state, useless later
    #order_dict = new Map();
    #value_lists = [];
    #suit_lists = [];
    constructor(players_id_arr){
        this.#players_id = players_id_arr; //array of all the ids
        this.#direction_id = this.#players_id;
        this.#players_id.forEach(e => this.#points.set(e, 0));//initilize the points for each player
        this.#n_players = this.#players_id.length; //number of players
    }

    resetState(){
        this.#dealer = -1;
        this.#dealer_pos = -1;
        this.#current = -1; //used to decide who is the current player to pull a new card
        this.#dealer_plus = 0; //position of the player that is receiving the cards in that moment
        this.#players_id; //array of all the ids
        this.#n_players;
        this.#cards_in_deck = Array.from({length: 40}, (_, i) => i); //cards still to be played
        this.#count_played = 0;
        this.#played = new Map();
        this.#briscola = -1;
        this.#briscola_suit = -1;
        this.#points = new Map();
    }

    pushStructures(id, d, v, s, remote_len){
        this.#order_dict.set(id, d);
        this.#value_lists.push(v);
        this.#suit_lists.push(s);
        if(remote_len && this.#value_lists.length === this.#suit_lists.length && this.#suit_lists.length === this.#order_dict.size && this.#value_lists.length === this.#order_dict.size){
            return this.#value_lists.length >= remote_len + 1;
        }
        return false;
    }

    pullFromDeck(){
        if(!this.#cards_in_deck)
            return;
        
        
        if(this.#cards_in_deck.length === 0){
            this.#cards_in_deck = null;
            return this.#briscola;
        }

        var card = this.#cards_in_deck[Math.floor(Math.random() * this.#cards_in_deck.length)];
        this.#cards_in_deck = this.#cards_in_deck.filter(deck_card => deck_card !== card);
        //this.#cards_in_hand += 1;
        return card;
    }

    pullThreeFromDeck(){
        var cards = [];
        var card;
        for(var i=0; i<3; i++){
            card = this.#cards_in_deck[Math.floor(Math.random() * this.#cards_in_deck.length)];
            this.#cards_in_deck = this.#cards_in_deck.filter(deck_card => deck_card !== card);
            cards.push(card)
        }
        //this.#cards_in_hand = 3;
        return cards;
    }

    getPosition(){
        return this.#dealer_pos;
    }

    getDealer(){
        return this.#dealer;
    }

    getPositionFromId(id){
        return this.#players_id.indexOf(id);
    }

    getStarterDict(){
        return this.#order_dict;
    }

    getValueList(){
        return this.#value_lists;
    }

    getSuitList(){
        return this.#suit_lists;
    }

    getStarterList(id){
        return this.#order_dict.get(id);
    }

    getCountPlayed(){
        return this.#count_played;
    }

    setCountPlayed(n){
        this.#count_played += n;
    }

    getPoints(){
        return this.#points;
    }

    getOrderedPoints(){
        this.#points[Symbol.iterator] = function* () {
            yield* [...this.entries()].sort((a, b) => b[1] - a[1]);
        }

        var ret = new Map();
        for (let [key, value] of this.#points) {     // get data sorted
            ret.set(key, value);
        }
        return ret;
    }

    getPointsId(id){
        return this.#points.get(id);
    }

    getDealerPlus(){
        return this.#dealer_plus;
    }

    getCardsInHand(){
        return this.#cards_in_hand;
    }

    getIsDrawing(){
        return this.#is_drawing;
    }

    resetIsDrawing(){
        //console.log('reset is drawing');
        if(this.#cards_in_hand === 0)
            this.#cards_in_hand = 3;
        else
            this.#cards_in_hand += 1;
        this.#is_drawing = false;
    }
    //function used to get the next one that needs to pull from the deck
    /**
     * @return true if there's still someone that needs to pull from the deck, false otherwise
     * 
     */
    
    getInitReceived(remote_len){
        if(this.#value_lists.length === this.#suit_lists.length && this.#suit_lists.length === this.#order_dict.size && this.#value_lists.length === this.#order_dict.size){
            return this.#value_lists.length >= remote_len + 1;
        }
        return false;
    }

    getBriscola(){
        return this.#briscola;
    }

    getCurrent(){
        return this.#current;
    }

    getPlayed(id){
        return this.#played.get(id);
    }

    setPlayed(id, value){
        if(!this.#played.get(id)){
            this.#played.set(id, value);
            return true;
        }
        return false;
    }
    /**
     * 
     */
    removeFromDeckDisconnected(){ 
        if(!this.#cards_in_deck || this.#cards_in_deck.length+1 < this.#n_players)
            return;
        //the card to be removed needs to be the lowest value (1-3-4-5-6) and not briscola
        //console.log('mod values: ', this.#cards_in_deck.length + 1, this.#n_players);
        var mod = (this.#cards_in_deck.length + 1) % this.#n_players; //briscola is removed from the deck but it needs to be counted
        var removed = [];
        var j = 0;
        while(j < mod){
            if(this.#cards_in_deck.length === 0)
                j = mod;
            var app_deck = this.#cards_in_deck.filter(card => Math.floor(card/10) !== Math.floor(this.#briscola/10));
            //there are no cards outside the ones with briscola suits, i have to remove one of them
            //briscola is never considered here because i'll always have at least a card to remove that's not briscola
            if(app_deck.length === 0)
                var app_deck = this.#cards_in_deck;
            //process to remove the lowest card possible
            var selected = app_deck[0];
            var prev = selected%10;
            var currcard;
            var curr;
            for(var i = 1; i < app_deck.length; i++){
                currcard = app_deck[i];
                curr = currcard%10;
                //different values
                if(VALUE_WEIGTH[curr] < VALUE_WEIGTH[prev]){
                    selected = currcard;
                    prev = curr;
                }
                //this is basically for the zeros
                else if(VALUE_WEIGTH[curr] === VALUE_WEIGTH[prev] && curr < prev){
                    selected = currcard;
                    prev = curr;
                }
            }
            this.removeFromDeck(selected);
            removed.push(selected);
            j++;
        }
        this.#count_played += removed.length
        removed.forEach(e => this.#removed.push(e));
        return removed;
    }

    pushDisconnected(id){
        this.#disconnected.push(id);
    }

    removePlayers(old_disconnected){
        for(var i in old_disconnected){
            //console.log('disconnected', this.#played.get(old_disconnected[i]));
            if(this.#played.get(old_disconnected[i]) !== -1) //player did play a card before disconnecting
                this.#count_played += this.#cards_in_hand;
            else //player did not play the card before disconnecting
                this.#count_played += this.#cards_in_hand + 1;
            //console.log('played:', this.#count_played)
        }
        if(old_disconnected.includes(this.#dealer))
            this.incDealer();

        //remove the player id from the list of ids
        this.#players_id = this.#players_id.filter(my_id => !old_disconnected.includes(my_id));
        this.#n_players = this.#players_id.length;
        if(!this.#players_id.includes(this.#dealer))
            this.#dealer = this.#players_id[0];
        
    }

    removePlayer(id){
        //console.log('removing player')
        this.#players_id = this.#players_id.filter(my_id => my_id !== id);
        this.#n_players = this.#players_id.length;
        this.#dealer_pos = this.#players_id.indexOf(this.#dealer);
        
        //console.log('ended remove player', this.#dealer_plus);
        
    }

    resetPlayed(){
        this.#played = new Map();
    }

    resetCurrent(){
        this.#current = this.#dealer;
    }

    checkRound(n){
        return (n === this.#n_players);
    }

    removeFromDeckList(card_list){
        if(card_list)
            this.#cards_in_deck = this.#cards_in_deck.filter(deck_card => !card_list.includes(deck_card));
    }

    removeFromDeck(card){
        //console.log('removing card: ', card);
        if(card >= 0 && this.#cards_in_deck)
            this.#cards_in_deck = this.#cards_in_deck.filter(deck_card => deck_card !== card);
    }

    pickId(){
        this.#is_drawing = true;
        var sum = new Array(this.#order_dict.size).fill(0);
        
        for(var key of this.#order_dict.keys()){
            var list = this.#order_dict.get(key);
            for(var elem in list){
                sum[list[elem]] += 1;
            }
        }

        var max = -1;
        sum.forEach(e => {max = Math.max(e, max)});
        this.#dealer_pos = sum.indexOf(max);
        this.#dealer = this.#players_id[this.#dealer_pos];
        this.#current = this.#dealer;
    }

    
    pickBriscola(){
        var pick = function(list){
            var value = -1;
            var max = 0;
            for(var j = 0; j < BRISCOLA_LEN; j++){
                var acc = 0;
                for(var i = 0; i < list.length; i++){
                    acc += list[i][j];
                }   
                if(acc >= max){
                    max = acc;
                    value = j;
                }
            }

            return value;
        }
        //pick suit
        var suit = pick(this.#suit_lists);
        //pick value
        var value = pick(this.#value_lists);
        this.#briscola = suit*10+value;
        this.#cards_in_deck = this.#cards_in_deck.filter(card => card !== this.#briscola);
        this.#briscola_suit = Math.floor(this.#briscola/10);
        return this.#briscola;
    }

    incCurrentCheckPlayed(){
        //i was supposed to play
        var i = 0;
        while(this.#played.get(this.#current) &&  i<this.#n_players){
            this.incCurrent();
            i++;
        }
        return i;
        
    }

    incCurrent(){
        this.#dealer_plus = (this.#dealer_plus + 1) % this.#n_players;
        //this way when dealer plus goes back to 0 current gets back to dealer and i can use current for the playing too
        var position = (this.#dealer_pos + this.#dealer_plus) % this.#n_players;
        this.#current = this.#players_id[position];
        //console.log('dealer plus', this.#dealer_plus, 'dealer_pos', this.#dealer_pos, 'position', position, 'current', this.#current, 'players', this.#players_id);

        //console.log('current: ', this.#current, 'position: ', position, 'dealer plus', this.#dealer_plus);
    }

    retDealerPlusOne(){
        return this.#players_id[(this.#dealer_pos + 1) % this.#n_players];
    }

    incDealer(){
        while(this.#played.get(this.#dealer) === -1){
            this.#dealer_pos = (this.#dealer_pos + 1) % this.#n_players;
            this.#dealer = this.#players_id[this.#dealer_pos];
        }
    }

    getNext(){
        this.incCurrent();
        return this.#dealer_plus !== 0;
    }

    //previous with respect to current
    isPrevId(my_id){
        var pos;
        for(var i = this.#dealer_plus; i >= 0; i--){
            pos = (i + this.#dealer_pos) % this.#n_players;
            if(this.#players_id[pos] === my_id)
                return true;
        }
        return false;
    }

    getDirectionRelativeToId(my_id, other_id){
        var my_position = this.#direction_id.indexOf(my_id);
        var other_position = this.#direction_id.indexOf(other_id);
        if(my_position === other_position)
            return 'bot';
        if(my_position > other_position){
            var diff = my_position - other_position;
            if(diff === 3)  return 'right';
            if(diff === 2)  return 'top';
            if(diff === 1)  return 'left';
        }

        if(my_position < other_position){
            var diff = other_position - my_position;
            if(diff === 3)  return 'left';
            if(diff === 2)  return 'top';
            if(diff === 1)  return 'right';
        }
    }

    whoTakes(){
        //waiting for all the players to make their moves
        if(this.#played.size < this.#n_players)
            return -1;
        //('begin who takes');
        //Here should be implemented all the logic to decide who takes the card and change the dealer to the id of who took the cards, also current = dealer
        this.#cards_in_hand -= 1;
        this.#is_drawing = true;
        var old_disconnected = [];
        this.#disconnected.forEach( e => old_disconnected.push(e));
        this.#disconnected = [];
        
        var i = 0;
        var pos;
        var prevcard = -1;
        var prevsuit;
        var prevval;
        var previd;

        
        this.#played.forEach((value) => {
            if(value !== -1)
                this.#count_played += 1;
        });
        //initialization due to disconnection, normal case is just a cycle
        while(i < this.#n_players && prevcard === -1){
            pos = (this.#dealer_pos + i) % this.#n_players;
            previd = this.#players_id[pos];
            prevcard = this.#played.get(previd);
            prevsuit = Math.floor(prevcard/10);
            prevval = prevcard % 10;
            i += 1;
        }
        
        var current;
        var sum = VALUE_WEIGTH[prevval];
        while(i < this.#n_players){
            pos = (this.#dealer_pos + i) % this.#n_players;
            current = this.#players_id[pos];
            var currcard = this.#played.get(current);
            if(currcard === -1){
                i += 1;
                continue;
            }
            var currsuit = Math.floor(currcard/10);
            var currval = currcard % 10;
            sum += VALUE_WEIGTH[currval];
            //if the suits of the two cards are the same i have to compute which one has the higher value (idc if they're both briscola)
            if(currsuit === prevsuit){
                //the second condition can happen when two cards are worth 0 points, in that case it's considered the higher number on the card
                if(VALUE_WEIGTH[currval] > VALUE_WEIGTH[prevval] || (VALUE_WEIGTH[currval] === VALUE_WEIGTH[prevval] && currval > prevval)){
                    //prevcard = currcard;
                    previd = current;
                    prevsuit = currsuit;
                    prevval = currval;
                }
            }//if the suits are different i only need to care if the card played after is briscola, if it is then it's automatically the highest
            //in fact if the card played before was also briscola the case would be captured by the previous if
            //if the card played before is not briscola but a different suit then that is the strongest already by setup
            else if(currsuit === this.#briscola_suit){
                    previd = current;
                    prevsuit = currsuit;
                    prevval = currcard % 10;
            }
            i += 1;
        }

        //sum the points
        this.#points.set(previd, this.#points.get(previd) + sum);
        //return the id of the player who took, and set it properly
        this.#dealer = previd;
        if(old_disconnected.length !== 0)
            this.removePlayers(old_disconnected)
        this.#current = this.#dealer;
        this.#dealer_pos = this.#players_id.indexOf(this.#dealer);
        this.#dealer_plus = 0;
        this.#played = new Map();
        //console.log('ended who takes');
        return previd;
    }

    whoWins(){
        return Math.max(...Array.from(this.#points.values()));
    }

    getDeck(){
        return this.#cards_in_deck;
    }

}

