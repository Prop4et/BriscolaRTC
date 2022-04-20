class Zone {
    #scene;
    #handZone = [];
    #name = new Map();
    #dropZone;
    #dropZoneOutline;
    constructor(scene, w, h) {
        this.#scene = scene;
        this.paintZones(scene, w, h)
        
    }

    onresize(){
        var w = document.getElementById('game_container').offsetWidth;
        var h = document.getElementById('game_container').offsetHeight;
    
         
    }

    paintZones(scene, w, h){

        this.#name.set('left', scene.add.text(LATERAL_MARGIN_ZONES-60, h/2, '').setAngle(90).setOrigin(0.5));//left
        this.#name.set('right', scene.add.text(w-LATERAL_MARGIN_ZONES+60, h/2, '').setAngle(270).setOrigin(0.5));//right
        this.#name.set('top', scene.add.text(w/2, LATERAL_MARGIN_ZONES-60, '').setOrigin(0.5));//top
        this.#name.set('bot', scene.add.text(w/2, h-LATERAL_MARGIN_ZONES+60, '').setOrigin(0.5));//bot also mine
        var dropWidth = w/3;
        var marginH = (h*75)/100;
        this.#dropZone = scene.add.zone(w/2, marginH, dropWidth, 1.2*CARD_HEIGHT).setRectangleDropZone(dropWidth, 1.2*CARD_HEIGHT);

        this.#dropZoneOutline = scene.add.graphics();
        this.#dropZoneOutline.lineStyle(1, 0x006600);
        this.#dropZoneOutline.fillStyle(0x006600, 0.8);
        this.#dropZoneOutline.fillRect(this.#dropZone.x - this.#dropZone.input.hitArea.width / 2, this.#dropZone.y - this.#dropZone.input.hitArea.height / 2, this.#dropZone.input.hitArea.width, this.#dropZone.input.hitArea.height);
        this.#dropZoneOutline.strokeRect(this.#dropZone.x - this.#dropZone.input.hitArea.width / 2, this.#dropZone.y - this.#dropZone.input.hitArea.height / 2, this.#dropZone.input.hitArea.width, this.#dropZone.input.hitArea.height);
    
    }

    getNamezone(){
        return this.#name;
    }

    reset(){
        /*for(var i in this.#handZone)
            this.#handZone[i].destroy();
        this.#handZone = [];*/
        for(var key of this.#name){
            this.#name.get(key[0]).setText('');
            this.#name.get(key[0]).destroy();
        }
        this.#name = new Map();
        this.#dropZoneOutline.destroy();
        this.#dropZone.destroy();
    }       

}