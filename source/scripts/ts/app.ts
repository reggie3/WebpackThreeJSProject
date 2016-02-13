/// <reference path="./defs/underscore/underscore.d.ts" />
/// <reference path="./defs/jquery/jquery.d.ts" />
/// <reference path="./defs/three/three.d.ts" />
/// <reference path="./gameObjects.ts" />

import * as $ from "jquery";
import * as _ from "underscore";
import * as THREE from "three";
import CANNON = require("cannon");

var game;
$(() => {
    console.log("jquery & underscore loaded");

    createGame();
});



function createGame(){
    game = new GameObjects.Game(CANNON, THREE);
    var scene = new GameScenes.Scene(THREE);
    var box = new GameObjects.Box();
    
    scene.add( box );

    scene.positionCamera(null,null,5);
    

    var render = function () {
        requestAnimationFrame( render );
        
        box.rotate(.1, null, null);
        box.rotate(null,.1,null);
        
        game.render(scene);
    };

    render();
}

