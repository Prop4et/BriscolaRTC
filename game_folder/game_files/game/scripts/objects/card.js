class Card{
    constructor(scene, w, h, sprite, i){
        this.scene = scene;
        this.w = w;
        this.h = h;
        this.sprite = this.scene.add.sprite((this.w-2)/2+i/5, (this.h-2)/2+i/5, sprite);
    }

    getSprite(){
        return this.sprite;
    }

    destroy(){
        this.sprite.destroy();
    }

    /**
     * 
     * @param {string} direction top bot left or right depending on who we are distributing (bot is us)
     * @param {integer} index 1-2-3 depending on the position of the card in the hand
     * @param {string} texture can be undefined, if not undefined we're giving the cards to ourselves and texture contains the "value" of the card
     */
    animateCard(direction, index, texture){
        this.sprite.index = index;

        const timeline = this.scene.tweens.timeline({
            onComplete: () => {
                timeline.destroy();
            }
        });

        timeline.add({
            targets: this.sprite,
            scale: 1.1,
            duration: 100
        });

        timeline.add({
            targets: this.sprite,
            scale: 1,
            x: CARD_DIRECTIONS[direction][index].x,
            y: CARD_DIRECTIONS[direction][index].y,
            angle: CARD_DIRECTIONS[direction].angle,
            duration: 100,
        });

        if(texture !== null && texture >= 0) 
            timeline.add({
                targets: this.sprite,
                scaleX: 0,
                duration: 50,
                delay: 50,
                onComplete: () => {
                        this.sprite.setTexture(texture);
                }
            });

        timeline.add({
            targets: this.sprite,
            scale: 1,
            duration: 100,
        });

        setTimeout(() => {timeline.play()}, index*200);

        if(texture !== null && texture >= 0) {
            this.sprite.setInteractive();
            this.scene.input.setDraggable(this.sprite);
        }
    }

    animatePlay(texture, direction){
        const timeline = this.scene.tweens.timeline({
            onComplete: () => {
                timeline.destroy();
            }
        });
        
        timeline.add({
            targets: this.sprite,
            scaleX: 0,
            duration: 100,
            delay: 100,
            onComplete: () => {
                    this.sprite.setTexture(texture);
            }
        });

        timeline.add({
            targets: this.sprite,
            scale: 1,
            x: CARD_DIRECTIONS_PLAYED[direction].x,
            y: CARD_DIRECTIONS_PLAYED[direction].y,
            duration: 100,
        });

        timeline.play();
    }

    animateTake(direction){
        const timeline = this.scene.tweens.timeline({
            onComplete: () => {
                timeline.destroy();
            }
        });
        
        timeline.add({
            targets: this.sprite,
            scaleX: 0,
            duration: 100,
            delay: 100,
            onComplete: () => {
                    this.sprite.setTexture('back');
            }
        });

        timeline.add({
            targets: this.sprite,
            scale: 1,
            x: CARD_DIRECTIONS[direction]['taken'].x,
            y: CARD_DIRECTIONS[direction]['taken'].y,
            angle: CARD_DIRECTIONS[direction].angle,
            duration: 100,
        });

        timeline.play();
    }
}