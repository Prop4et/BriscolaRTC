"use strict";
class Disconnected{
    constructor(scene, position){
        this.scene = scene;
        this.sprite = this.scene.add.sprite(DEALER_BUTTON[position].x, DEALER_BUTTON[position].y, 'disconnected');
    }

    destroy(){
        this.sprite.destroy();
    }
}