const CONTAINER_WIDTH = 100;
const CONTAINER_HEIGHT = 100;

const PLAYER_OFFSET_X = 0;
const PLAYER_OFFSET_Y = 0;

const LATERAL_MARGIN_ZONES = 90;
const MARGIN_DROPZONES = 215;
const CARD_HEIGHT = 100;
const CARD_WIDTH = 60;
const CARD_MARGIN = 10;
const DEALER_BUTTON_MARGIN = 170;

const DROP_WIDTH = 800;
const DROP_HEIGHT = 200;

const PLAYER_NAME_OFFSET_X = 0;
const PLAYER_NAME_OFFSET_Y = -80;
const PLAYER_NAME_STYLE = 
{   
    fontFamily: 'Roboto',
    fontSize: '20px',
    color: '#020202',
    fontStyle: 'normal',
    strokeThickness: 1,
    shadow: 0
};

const START_SCENE_KEY = 'game_scene';

const VALUE_WEIGTH = {
    0: 11, 
    1: 0, 
    2: 10, 
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 2,
    8: 3,
    9: 4
}

const LIST_LEN = 10;
const BRISCOLA_LEN = 10;

const SCENE_CONFIG =
{
    key: START_SCENE_KEY,
    pack: 
    {
        files: 
        [{
            type: 'plugin',
            key: 'rexwebfontloaderplugin',
            url: 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexwebfontloaderplugin.min.js',
            start: true
        }]
    }
};

const GAME_CONFIG = 
{
    title: 'briscola',
    type: Phaser.AUTO,
    backgroundColor: 'rgb(24, 117, 1)',
    scale:
    {
        parent: 'game_container',
        mode: Phaser.Scale.FIT,
        width: document.getElementById('game_container').offsetWidth,
        height: document.getElementById('game_container').offsetHeight,
    },
    physics: 
    {
        default: 'arcade',
        arcade: 
        {
            debug: false
        }
    },
};

const DEALER_BUTTON = {
    top: {x: GAME_CONFIG.scale.width/2 + 2*CARD_WIDTH + CARD_MARGIN, y: DEALER_BUTTON_MARGIN},
    bot : {x: GAME_CONFIG.scale.width/2 + 2*CARD_WIDTH + CARD_MARGIN, y: GAME_CONFIG.scale.height-DEALER_BUTTON_MARGIN},
    left: {x: DEALER_BUTTON_MARGIN, y: GAME_CONFIG.scale.height/2 + 2*CARD_WIDTH + CARD_MARGIN},
    right: {x: GAME_CONFIG.scale.width - DEALER_BUTTON_MARGIN, y: GAME_CONFIG.scale.height/2 - 2*CARD_WIDTH - CARD_MARGIN}
}

const CARD_DIRECTIONS = {   
    top: {
        2: {x: GAME_CONFIG.scale.width/2 + CARD_WIDTH + CARD_MARGIN, y: LATERAL_MARGIN_ZONES},
        1: {x: GAME_CONFIG.scale.width/2, y: LATERAL_MARGIN_ZONES},
        0: {x: GAME_CONFIG.scale.width/2 + - CARD_WIDTH - CARD_MARGIN, y: LATERAL_MARGIN_ZONES},
        'taken': {x: GAME_CONFIG.scale.width/2 + - 3*CARD_WIDTH - CARD_MARGIN, y: LATERAL_MARGIN_ZONES},
        angle: 0
    },
    bot: {
        0: {x: GAME_CONFIG.scale.width/2 + - CARD_WIDTH - CARD_MARGIN, y:  GAME_CONFIG.scale.height-LATERAL_MARGIN_ZONES},
        1: {x: GAME_CONFIG.scale.width/2, y:  GAME_CONFIG.scale.height-LATERAL_MARGIN_ZONES},
        2: {x: GAME_CONFIG.scale.width/2 + CARD_WIDTH + CARD_MARGIN, y: GAME_CONFIG.scale.height-LATERAL_MARGIN_ZONES},
        'taken': {x: GAME_CONFIG.scale.width/2 + 3*CARD_WIDTH + CARD_MARGIN, y: GAME_CONFIG.scale.height-LATERAL_MARGIN_ZONES},
        angle: 0
    },
    left: {
        2: {x: LATERAL_MARGIN_ZONES, y: GAME_CONFIG.scale.height/2 + CARD_WIDTH + CARD_MARGIN},
        1: {x: LATERAL_MARGIN_ZONES, y: GAME_CONFIG.scale.height/2},
        0: {x: LATERAL_MARGIN_ZONES, y: GAME_CONFIG.scale.height/2 - CARD_WIDTH - CARD_MARGIN},
        'taken': {x: LATERAL_MARGIN_ZONES, y: GAME_CONFIG.scale.height/2 + 3*CARD_WIDTH - CARD_MARGIN},
        angle: 90
    },
    right: {
        2: {x: GAME_CONFIG.scale.width - LATERAL_MARGIN_ZONES, y: GAME_CONFIG.scale.height/2 - CARD_WIDTH - CARD_MARGIN},
        1: {x: GAME_CONFIG.scale.width - LATERAL_MARGIN_ZONES, y: GAME_CONFIG.scale.height/2},
        0: {x: GAME_CONFIG.scale.width - LATERAL_MARGIN_ZONES, y: GAME_CONFIG.scale.height/2 + CARD_WIDTH + CARD_MARGIN},
        'taken': {x: GAME_CONFIG.scale.width - LATERAL_MARGIN_ZONES, y: GAME_CONFIG.scale.height/2 - 3*CARD_WIDTH + CARD_MARGIN},
        angle: 90
    },

};


const CARD_DIRECTIONS_PLAYED = {   
    top: {
        x: GAME_CONFIG.scale.width/2, y: MARGIN_DROPZONES,
    },
    left: {
        x: MARGIN_DROPZONES, y: GAME_CONFIG.scale.height/2,
    },
    right: {
        x: GAME_CONFIG.scale.width - MARGIN_DROPZONES, y: GAME_CONFIG.scale.height/2,
    },

};

const InGameMessage = {
    INIT_DONE: 'init_done', 
    PULLED_CARDS: 'pulled_cards',
    PULLED_CARD: 'pulled_card',
    CHECK_DECK: 'check_deck',
    CARD_PLAYED: 'card_played'
}
