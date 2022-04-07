class Dealer{
    constructor(scene, w, h, direction){
        this.scene = scene;
        this.w = w;
        this.h = h;
        this.sprite = this.scene.add.sprite(DEALER_BUTTON[direction].x, DEALER_BUTTON[direction].y, 'dealer');
    }

    getSprite(){
        return this.sprite;
    }

    animate(direction){
        const timeline = this.scene.tweens.timeline({
            onComplete: () => {
                timeline.destroy();
            }
        });

        timeline.add({
            targets: this.sprite,
            scale: 1,
            x: DEALER_BUTTON[direction].x,
            y: DEALER_BUTTON[direction].y,
            duration: 100,
        });

        timeline.play()
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve("done"), 150);
        });
    }
}