import {Body, Ephemeris} from "./Body.js";
import * as THREE from "https://cdn.skypack.dev/three";
import { OrbitControls } from 'https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js';
import {Gravity} from "./Gravity.js"

angular.module('gravitationApp', []).controller('MainController', 
                                                function ($scope) {
  
  
  
  let main = this;
  let scene, camera, renderer, controls;
  main.availableSpeeds = Gravity.availableSpeeds;
  main.availableIntegrators = Gravity.availableIntegrators;
  //UI control variables
  var dragStart = new THREE.Vector3();
  var dragEnd = new THREE.Vector3();
  var dragVector = new THREE.Vector3();
  let mouseDrag = false;
  main.bodiesListShown = false;
  main.showTraj = true;
  let mouse = new THREE.Vector2();
  //time control variables
  let startCounter = new Date().getTime();
  let frmTime = startCounter;
  let phsStart = startCounter;
  let phsTime = startCounter;
  let phsTicksPerSecond = 30;
  let phsCycle = 1000/phsTicksPerSecond;
  let frmCounter = 0;
  let trajLength = 200;//just array length, 
                       //calculating real time too complicated

  // new body creation plane
  let planeZ = new THREE.Mesh(new THREE.PlaneGeometry(100000, 100000), 
                              new THREE.MeshBasicMaterial(
                              {color: 0xffff00, side: THREE.DoubleSide}));
  // newBody
  ////Speed vector
  let speedArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0),
                                         new THREE.Vector3(0, 0, 0),
                                         100, 0xff0000);

  speedArrow.name = "speedArrow";
  let newBody = new THREE.Group();
  newBody.add(new THREE.Mesh(new THREE.IcosahedronGeometry(3, 2), 
                             new THREE.MeshPhongMaterial({
                               color: 0x000000,
                               emissive: 0x072534,
                               side: THREE.DoubleSide,
                               flatShading: true})));
  newBody.add(speedArrow);
      
  //axis
  let axisHelper = new THREE.AxesHelper(500);
  this.toggleAxes = function () {
    if (main.showAxes)
      scene.add(axisHelper);
    else
      scene.remove(axisHelper);
  };
            
  let gridHelper = new THREE.PolarGridHelper(100, 50, 10, 50);
  gridHelper.rotation.x = Math.PI / 2;

  // Show / Hide Ecliptic Plane
  main.toggleGrid = function () {
    if (main.showGrid)
      scene.add(gridHelper);
    else
      scene.remove(gridHelper);
  };
      
      
  main.toggleBodiesList = function () {
    main.bodiesListShown = !main.bodiesListShown;
  }
            
  main.toggleTraj = function(){
    if(!main.showTraj){
      for(let i in main.bodies){
        let body = main.bodies[i];
        scene.remove(body.trajObj);
        body.traj = [];
      }
    }
  }
           
  main.resetCamera = function () {
    main.tracking = null;
    main.simSpeed = main.availableSpeeds[2];
    controls.maxDistance = 10000
    controls.reset();
  };

  main.createBody = function () {
    if(main.creation){
      main.creation = false;
      Gravity.pause_simulation = false;
      scene.remove(newBody);
    }else{
      main.creation = true;
      Gravity.pause_simulation = true;
      newBody.position.x = 0.0;
      newBody.position.y = 0.0;
      newBody.position.z = 0.0;
      
      scene.add(newBody);
    }
  };
      
  this.togglePause = function () {
      if (Gravity.pause_simulation && !main.creation)
          Gravity.pause_simulation = false;
      else
          Gravity.pause_simulation = true;
  };

  main.newName = 'New';
  main.newMass = 10;
  main.newRadius = 1000;
  main.newPositionX = 1;
  main.newPositionY = 0;
  main.newPositionZ = 0;
  main.newVelocityX = 0;
  main.newVelocityY = 5;
  main.newVelocityZ = 0;
  main.newAcceleration = 0;
  main.newColor = 'ffffff';

  main.bodies = Ephemeris.bodies;

  let sun = main.bodies[0];

  main.remove = function (body) {
    let i = main.bodies.indexOf(body);
    scene.remove(body.mesh);
    main.bodies.splice(i, 1);
  };

 main.track = function (body) {
   main.tracking = body;
   main.simSpeed = main.availableSpeeds[0];
   controls.maxDistance = 2;
 };

  init();
  animate();

  function init() {

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
                         40, 
                         window.innerWidth / window.innerHeight,
                         0.001, 
                         100000);
    camera.position.set(500, -500, 500);
                
    main.simSpeed = main.availableSpeeds[2];
    main.integrator = main.availableIntegrators[1];
    camera.up.set( 0, 0, 1 );
    for (let i in main.bodies) {
      scene.add(main.bodies[i].mesh);
    }
    let light2 = new THREE.AmbientLight(0x333333);
    scene.add(light2);                
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxDistance = 10000;
    controls.enableDamping = true;
//    controls.dampingFactor = 1;
    // controls.enableZoom = true;

    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      'resources/2k_stars_milky_way.jpg',
      () => {
        const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
        rt.fromEquirectangularTexture(renderer, texture);
        scene.background = rt;
      });

    main.tracking = null;
  }

  function animate(apply) {
    requestAnimationFrame(animate);
    //fps counter
    frmTime = new Date().getTime();
    phsTime = frmTime;
    if (frmTime - startCounter >= 1000){
      startCounter = new Date().getTime();
      $scope.$apply();
      $scope.frameRate = frmCounter;
      frmCounter = 0;
    }else{
      frmCounter++;
    }
                
    if(phsTime - phsStart>= phsCycle && !Gravity.pause_simulation){
      phsStart = new Date().getTime();
      for (let i = 0; i < main.simSpeed.physics_loop; i++){
        physicsTick();
      }
    }


    if (main.tracking) {
      let pos = main.tracking.mesh.position;
      controls.target = new THREE.Vector3(pos.x, pos.y, pos.z);
      controls.update();
    }
    if (main.creation && !mouseDrag) {
      let newPos = pickVector3FromScene(planeZ, mouse, camera);
      newBody.position.x = newPos.x;
      newBody.position.y = newPos.y;
      newBody.position.z = newPos.z;
      controls.enabled = false;
      controls.update();
    } else if( main.creation && mouseDrag ){
      dragEnd = pickVector3FromScene( planeZ, mouse, camera );
      dragVector = dragEnd.sub( dragStart );
      main.newVelocity = 0.1*Gravity.magnitudeVec3([dragVector.x,
                                                    dragVector.y,
                                                    dragVector.z]);
      speedArrow.setDirection(new THREE.Vector3(dragVector.x, 
                                                dragVector.y, 
                                                dragVector.z).normalize());
      speedArrow.setLength(main.newVelocity*10);
      $scope.$apply();
      controls.enabled = false;
      controls.update();
    } else {
        controls.enabled = true;
        controls.update();
    }         
    if (main.bodiesListShown && apply){
      $scope.$apply();
    }
    renderer.render(scene, camera);
  }

  function updateTraj(){
    for (let i in main.bodies){
      let body = main.bodies[i];
      let traj = body.traj;
      let coord = transformInScreenCoord(body.position);
      traj.push(coord);
      
      if(traj.length > trajLength){
        traj.shift();    
      }
      if(traj.length > 3){
        scene.remove(body.trajObj);
        const curve = new THREE.CatmullRomCurve3( traj );
        body.trajObj = new THREE.Line( 
                               new THREE.BufferGeometry().setFromPoints(curve.getPoints(trajLength*2)), 
                               new THREE.LineBasicMaterial({color: body.color, linewidth: 5}));
        scene.add(body.trajObj);
      }
      body.traj = traj;
    }
  }
      
      
      
      
  function physicsTick(){
    if(main.showTraj){
      updateTraj();
    }
    Gravity.ApplyGravity(main.bodies);
    for (let i in main.bodies) {
      let body = main.bodies[i];
      if (!body.toDestroy) {
        body.physics_body.UpdatePositionalState(0.0, main.simSpeed.stepSize, main.integrator.f);
        body.position = body.physics_body.position;
        body.velocity = body.physics_body.velocity;
        let coord = transformInScreenCoord(body.position);
        body.mesh.position.copy(coord);
        body.mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), math.PI/100);
      } else {
        main.remove(body);
      }
    }                   
  }
            
  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('mousedown', onMouseDown, false);
  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('mouseup', onMouseUp, false);


  function onMouseDown(event) {
    switch (event.button) {
      case 0:
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera( mouse, camera );
        for (let i in main.bodies) {
          let body = main.bodies[i];
          //intersectObjects maybe?
          let intersect = raycaster.intersectObject(body.mesh);
            if (intersect.length > 0) {
                main.track(body);
                controls.maxDistance = 2;
                return;
            }
        }
        break;
      case 1:
        break;
      case 2:
        if (main.creation) {
          mouseDrag = true;
          dragStart = pickVector3FromScene(planeZ, mouse, camera);
        }else{
          main.tracking = null;
          controls.maxDistance = 10000;
        }
        break;
    }
  }

  function onMouseMove(event) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
  }

  function onMouseUp( event ){
    switch ( event.button ){
      case 0:
        break;
      case 1:
        break;
      case 2:
        mouseDrag = false;
        if(main.creation){
          main.creation = false;
          Gravity.pause_simulation = false;
          let newPlanet = new Body(main.newName, main.newMass, main.newRadius,
                        {x: newBody.position.x / 100, 
                         y: newBody.position.y / 100, 
                         z: newBody.position.z / 100},
                        {x: dragVector.x / 3652.5, 
                         y: dragVector.y / 3652.5, 
                         z: dragVector.z / 3652.5});
          main.bodies.push(newPlanet);
          scene.add(newPlanet.mesh);
          scene.remove(newBody);
        }
        break;
    }
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  
});
  
function pickVector3FromScene(plane, mouse, camera) {

  //todo: check whether the mouse on plane
  // update the picking ray with the camera and mouse position
         
  let raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  // calculate objects intersecting the picking ray
  let intersect = raycaster.intersectObject(plane);
  return intersect[0].point;
}
  
function transformInScreenCoord(r, scale=100) {
  return new THREE.Vector3(r.x*scale, r.y*scale, r.z*scale);
}


