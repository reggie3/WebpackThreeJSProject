/// <reference path="./defs/three/three.d.ts" />



module GameObjects{
    
    export class Game{
        name: string;
        state: string;
        renderer;
        world;  //the physics world
        CANNON;
        THREE;

        constructor(CANNON, THREE){
            this.CANNON = CANNON;
            this.THREE = THREE;
            //init renderer
            this.renderer = new THREE.WebGLRenderer();
            this.renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( this.renderer.domElement );
            
            //init physics world
            this.world = new CANNON.World();
            this.world.gravity.set(0, 0, -9.82); // m/s²
            console.log("new world created");
    
            console.log("new Game created");
        }  
        
        render(scene){
            this.renderer.render(scene.threeScene, scene.camera);
        }
    }
    
    //an item in the game.  meant to be a superclass for actual game objects
    export class GameItem{
        static gameItemID: number = 0;
        static gameItems = [];
        gameObjectID: number;
        
        constructor(){
            this.gameObjectID = GameItem.gameItemID;

            //store this gameObject in an array for later
            GameItem.gameItems[this.gameObjectID] = this;
            console.log("Object " + GameItem.gameItemID + " created.");
            GameItem.gameItemID ++;
        } 
        
        getItem(id: number){
            return GameItem.gameItems[id];
        }
    }
    
    
    export class Box extends GameItem{
        geometry;
        material;
        mesh;
        constructor(){
            super();
            
            this.geometry = new THREE.BoxGeometry( 1, 1, 1 );;
            this.material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );;
            this.mesh = new THREE.Mesh(this.geometry, this.material );;
        }
        
        rotate(x?:number, y?:number, z?:number){
            if(x)
                this.mesh.rotation.x += x;
            if(y)
                this.mesh.rotation.y += y;
            if(z)
                this.mesh.rotation.z += z;
        }
    }
}
