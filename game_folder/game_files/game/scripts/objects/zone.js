class Zone {
    #handZone = [];
    #name = new Map();
    #dropZone;
    #dropZoneOutline;
    constructor(scene, w, h) {
        this.paintZones(scene, w, h)
    }

    paintZones(scene, w, h){
        this.#handZone.push(scene.add.zone(LATERAL_MARGIN_ZONES, h/2, CARD_HEIGHT, 3*CARD_WIDTH + 2*CARD_MARGIN));//left
        this.#handZone.push(scene.add.zone(w-LATERAL_MARGIN_ZONES, h/2, CARD_HEIGHT, 3*CARD_WIDTH + 2*CARD_MARGIN));//right
        this.#handZone.push(scene.add.zone(w/2, LATERAL_MARGIN_ZONES, 3*CARD_WIDTH + 2*CARD_MARGIN, CARD_HEIGHT));//top
        this.#handZone.push(scene.add.zone(w/2, h-LATERAL_MARGIN_ZONES, 3*CARD_WIDTH + 2*CARD_MARGIN, CARD_HEIGHT));//bot also mine

        this.#name.set('left', scene.add.text(LATERAL_MARGIN_ZONES-60, h/2, '').setAngle(90).setOrigin(0.5));//left
        this.#name.set('right', scene.add.text(w-LATERAL_MARGIN_ZONES+60, h/2, '').setAngle(270).setOrigin(0.5));//right
        this.#name.set('top', scene.add.text(w/2, LATERAL_MARGIN_ZONES-60, '').setOrigin(0.5));//top
        this.#name.set('bot', scene.add.text(w/2, h-LATERAL_MARGIN_ZONES+60, '').setOrigin(0.5));//bot also mine

        this.#dropZone = scene.add.zone(w/2, h-MARGIN_DROPZONES, DROP_WIDTH, 1.5*CARD_HEIGHT).setRectangleDropZone(DROP_WIDTH, 1.5*CARD_HEIGHT);

        this.#dropZoneOutline = scene.add.graphics();
        this.#dropZoneOutline.lineStyle(1, 0x006600);
        this.#dropZoneOutline.fillStyle(0x006600, 0.8);
        this.#dropZoneOutline.fillRect(this.#dropZone.x - this.#dropZone.input.hitArea.width / 2, this.#dropZone.y - this.#dropZone.input.hitArea.height / 2, this.#dropZone.input.hitArea.width, this.#dropZone.input.hitArea.height);
        this.#dropZoneOutline.strokeRect(this.#dropZone.x - this.#dropZone.input.hitArea.width / 2, this.#dropZone.y - this.#dropZone.input.hitArea.height / 2, this.#dropZone.input.hitArea.width, this.#dropZone.input.hitArea.height)
    
    }

    getNamezone(){
        return this.#name;
    }

    reset(){
        for(var i in this.#handZone)
            this.#handZone[i].destroy();
        this.#handZone = [];
        for(var key of this.#name){
            this.#name.get(key[0]).setText('');
            this.#name.get(key[0]).destroy();
        }
        this.#name = new Map();
        this.#dropZoneOutline.destroy();
        this.#dropZone.destroy();
    }       

}