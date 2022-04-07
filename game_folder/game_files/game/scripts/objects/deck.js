class Deck{
    #maxCards = 40;
    #scene;
    #top;
    #cards;
    #briscola;
    #hand_cards = new Map();
    #id_direction = new Map();
    #played_cards = new Map();
    #played_index = new Map();
    #removed = 0;
    constructor(scene, w, h){
        this.#scene = scene;
        this.#top = this.#maxCards-1; 
        this.#cards = [];
        for(var i = 0; i < this.#maxCards; i++)
            this.#cards.push(new Card(scene, w, h, 'back', i));
        
    }

    resetCards(){
        for(var i = 0; i < this.#cards.length; i++)
            this.#cards[i].destroy();
        this.#hand_cards = null;
        this.#id_direction = null;
        this.#played_cards = null;
        this.#played_index = null;
    }

    giveCard(direction, id, texture){
        if(this.#top < -1)
            return;

        var card_map = this.#hand_cards.get(id);
        var i = this.#played_index.get(id);
        var card;
        if(this.#top === -1){//gotta play the briscola bruh
            card = this.#briscola;
            card.getSprite().setTexture('back');
        }else{
            card = this.#cards[this.#top];
        }
        this.#top -= 1;
        card_map.set(i, card);       
        card.animateCard(direction, i, texture);
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve("done"), 600)
        });
    }

    giveCards(direction, pulled, id){
        this.#id_direction.set(id, direction);
        var given = new Map();
        for(var i = 0; i<3; i++){
            var card = this.#cards[this.#top];
            this.#top -= 1;
            card.animateCard(direction, i, pulled[i]);
            given.set(i, card);
        }
        this.#hand_cards.set(id, given);
    }

    setPlayed(id, index){
        var played_map = this.#hand_cards.get(id);
        var played = played_map.get(index);
        this.#played_index.set(id, index);
        //keep the card played for the animation later 
        this.#played_cards.set(id, played);

        //set the new hand 
        this.#hand_cards.set(id, played_map);
        //remove the player card from the hand
        played_map.delete(index);
        return played;
    }

    animatePlayedCard(id, value, index){
        var played = this.setPlayed(id, index);
        
        //animate the played card
        played.animatePlay(value, this.#id_direction.get(id));

        
    }

    cardsTakenBy(v){
        this.#played_cards.forEach( (value) =>{
            value.animateTake(this.#id_direction.get(v));
        });
        return new Promise((resolve, reject) => {
            setTimeout(() => {this.#played_cards = new Map(); resolve("done")}, 1500)
        });
    }

    animateBriscola(texture){
        this.#briscola = this.#cards[this.#top];
        var card = this.#briscola.getSprite();
        this.#top -= 1;
        const timeline = this.#scene.tweens.timeline({
            onComplete: () => {
                timeline.destroy();
            }
        });

        timeline.add({
            targets: card,
            scale: 1.1,
            duration: 100
        });

        timeline.add({
            targets: card,
            scaleX: 0,
            duration: 100,
            delay: 200,
            onComplete: () => {
                card.setTexture(texture);
            }
        });

        timeline.add({
            targets: card,
            scale: 1.1,
            duration: 100,
        });

        timeline.add({
            targets: card,
            scale: 1,
            x: GAME_CONFIG.scale.width/2 + CARD_WIDTH + 3 * CARD_MARGIN,
            y: GAME_CONFIG.scale.height/2,
            delay: 100,
            duration: 100,
        });

        timeline.play();
    }  
    
    animateRemove(txt){
        var card = this.#cards[this.#top].getSprite();
        this.#top -= 1;
        const timeline = this.#scene.tweens.timeline({
            onComplete: () => {
                timeline.destroy();
            }
        });

        timeline.add({
            targets: card,
            scaleX: 0,
            duration: 100,
            delay: 200,
            onComplete: () => {
                card.setTexture(txt);
            }
        });

        timeline.add({
            targets: card,
            scale: 1.1,
            duration: 100,
        });

        timeline.add({
            targets: card,
            scale: 1,
            x: GAME_CONFIG.scale.width - this.#removed*(CARD_WIDTH + 3 * CARD_MARGIN),
            y: GAME_CONFIG.scale.height - 100,
            delay: 100,
            duration: 100,
        });

        timeline.play();
    }

    removeDisconnection(list){
        this.#removed += list.length;
        for(var i in list)
            this.animateRemove(list[i]);
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve("done"), 1000);
        });
    }
}