"use strict";
class CountDown{
    scene; /**@type {Phaser.Scene} */
    label; /**@type {Phaser.GameObjects.Text} */
    timerEvent; /**@type {Phaser.Time.TimerEvent} */
    duration = 0;
    constructor(scene, label){
        this.scene = scene;
        this.label = label;
    }
    setLabel(text){
        this.label.setText(text); 
    }
    
    //duration is a minute
    start(callback, duration = 60000){
        this.stop();
        this.duration = duration;
        this.timerEvent = this.scene.time.addEvent({
            delay: duration,
            callback: () => {
                this.label.text = '0.00'
                this.stop();
                if(callback)   
                    setTimeout(() => callback(), 100);
            }
        });
    }

    stop(){
        if(this.timerEvent){
            this.timerEvent.destroy();
            this.timerEvent = null;
        }
    }

    update(){
        if(!this.timerEvent || this.duration <= 0)
            return;
        const elapsed = this.timerEvent.getElapsed();
        const remaining = this.duration - elapsed;
        const seconds = remaining / 1000;

        this.label.text = seconds.toFixed(2);

    }
}