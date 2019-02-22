angular.module('gravitationApp', []).controller('MainController', 
                                                function ($scope) {
  let main = this;
  let scene, camera, renderer, controls;
  main.availableSpeeds = [{physLoop: 1,  
                           stepSize: 1/365/30/24/60, 
                           name: "minutes per second"},
                          {physLoop: 60, 
                           stepSize: 1/365/30/24/60, 
                           name: "hours per second"},
                          {physLoop: 24, 
                           stepSize: 1/365/30/24,    
                           name: "days per second"},
                          {physLoop: 7,  
                           stepSize: 1/365/30,       
                           name: "weeks per second"},
                          {physLoop: 30, 
                           stepSize: 1/365/30,       
                           name: "months per second"},
                          {physLoop: 52, 
                           stepSize: 7/365/30,       
                           name: "years per second"}];
  //control variables
  var dragStart = new THREE.Vector3();
  var dragEnd = new THREE.Vector3();
  var dragVector = new THREE.Vector3();
  let mouseDrag = false;
  let pauseSim = false;
  main.bodiesListShown = false;
  main.showTraj = true;
  let mouse = new THREE.Vector2();
  let indicateDistantObjects = true;
  //time control variables
  let startCounter = new Date().getTime();
  let frmTime = startCounter;
  let phsStart = startCounter;
  let phsTime = startCounter;
  let phsTicksPerSecond = 30;
  let phsCycle = 1000/phsTicksPerSecond;
  let frmCounter = 0;
  let trajLength = 100;//just array length, 
                       //calculating real time too complicated
  let trajUpdateCounter = 0;
  let trajUpdateFreq = 1; // phys Ticks

  // creation plane
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
                               shading: THREE.FlatShading})));
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
    controls.reset();
  };

  main.createBody = function () {
    if(main.creation){
      main.creation = false;
      pauseSim = false;
      scene.remove(newBody);
    }else{
      main.creation = true;
      pauseSim = true;
      newBody.position = new THREE.Vector3(0, 0, 0);
      scene.add(newBody);
    }
  };
      
  this.togglePause = function () {
      if (pauseSim && !main.creation)
          pauseSim = false;
      else
          pauseSim = true;
  };

  main.newName = 'New';
  main.newMass = 1;
  main.newRadius = 1000;
  main.newPositionX = 1;
  main.newPositionY = 0;
  main.newPositionZ = 0;
  main.newVelocityX = 0;
  main.newVelocityY = 5;
  main.newVelocityZ = 0;
  main.newAcceleration = 0;
  main.newColor = 'ffffff';

  //initializing bodies, file Ephemeris.js is created by python code
  main.bodies = Ephemeris.bodies;
  let sun = main.bodies[0];
  let sunLight;
  main.add = function () {
    let color = parseInt('0x' + main.newColor);
    let body = new Body(main.newName, 
                        main.newMass, 
                        main.newRadius, 
                        [main.newPositionX, 
                         main.newPositionY, 
                         main.newPositionX], 
                        [main.newVelocityX, 
                         main.newVelocityY, 
                         main.newVelocityZ], 
                        main.newAcceleration, 
                        color);
    main.bodies.push(body);
    addToScene(body);
  };

  main.remove = function (body) {
    let i = main.bodies.indexOf(body);
    scene.remove(body.mesh);
    main.bodies.splice(i, 1);
  };

  function addToScene(body) {
    let geometry = new THREE.IcosahedronGeometry(body.radius, 2);
    let material = new THREE.MeshPhongMaterial({
                    color: body.color, emissive: 0x072534
                    });
    body.mesh = new THREE.Object3D();
    body.mesh.add(new THREE.Mesh(geometry, material));

    //indicator at distance
    body.mesh.add(new THREE.Mesh(
                    new THREE.IcosahedronGeometry(5, 2),
                    new THREE.MeshBasicMaterial({
                      color: body.color,
                      emisive: body.color,
                      opacity: 0.1,
                      transparent:  true}  )));                
    body.mesh.name = body.name;
    if(body.name == "Saturn"){
      let saturnRadius = body.mesh.children[0].geometry.parameters.radius;
      let ring = new THREE.TorusGeometry(saturnRadius*1.5, 1.3E-2, 20, 20);
      ring.scale(1, 1, 0.2);
      ring.lookAt(new THREE.Vector3(0.3, 0.3, 1.5));
      body.mesh.add(new THREE.Mesh(ring, new THREE.MeshBasicMaterial(
      {color: body.color})));
    }
    scene.add(body.mesh);

    let coord = transformInScreenCoord(body.position);
    body.mesh.position = new THREE.Vector3(coord.x, coord.y, coord.z);
 }

 main.track = function (body) {
   main.tracking = body;
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
                
    main.simSpeed = main.availableSpeeds[3];
    camera.up.set( 0, 0, 1 );
    updateColors();
    for (let i in main.bodies) {
      addToScene(main.bodies[i])
    }
    //Lights
    sunLight = new THREE.PointLight(0xffaaaa, 5, 0, 0);
    sunLight.position.set(sun.mesh.position.x, 
                          sun.mesh.position.y, 
                          sun.mesh.position.z);
    // sunLight.color.setHSL( 0.55, 0.9, 0.5 );
    scene.add(sunLight);
    let light2 = new THREE.AmbientLight(0x333333);
    scene.add(light2);                
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.maxDistance = 10000;
    controls.enableDamping = true;
//    controls.dampingFactor = 1;
    // controls.enableZoom = true;
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
                
    if(phsTime - phsStart>= phsCycle && !pauseSim){
      phsStart = new Date().getTime();
      physicsTick();
      sunLight.position.set(sun.mesh.position.x, 
                            sun.mesh.position.y, 
                            sun.mesh.position.z);
    }


    if (main.tracking) {
      let pos = main.tracking.mesh.position;
      controls.target = new THREE.Vector3(pos.x, pos.y, pos.z);
      controls.update();
    }
    if (main.creation && !main.mouseDrag) {
      let newPos = pickVector3FromScene(planeZ, mouse, camera);
      newBody.position.x = newPos.x;
      newBody.position.y = newPos.y;
      newBody.position.z = newPos.z;
      controls.enabled = false;
      controls.update();
    } else if( main.creation && main.mouseDrag ){
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
                
    distantObjectIndication();
    if (main.bodiesListShown && apply){
      $scope.$apply();
    }
    renderer.render(scene, camera);
  }

  function distantObjectIndication(){
    for (let i in main.bodies){
      let body = main.bodies[i];
      let coord = transformInScreenCoord(body.position);
      let distMag = new THREE.Vector3()
        .subVectors(coord, camera.position).length();
      if (distMag>100){
        indicateDistantObjects = true;
      }else {
        indicateDistantObjects = false;
	break;
      }
    }
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
        body.trajObj = new THREE.Line( 
                             new THREE.BufferGeometry().setFromPoints(traj), 
                             new THREE.LineBasicMaterial({color: body.color}));
        scene.add(body.trajObj);
      }
      body.traj = traj;
    }
  }
      
      
      
      
  function physicsTick(){
    Gravity.step = main.simSpeed.stepSize;
    if(main.showTraj){
      if(trajUpdateCounter > trajUpdateFreq){
        updateTraj();
        trajUpdateCounter = 0;
      }else{
        trajUpdateCounter++;
      }
    }
    for (let k=0; k<main.simSpeed.physLoop; k++){
      Gravity.calculateGravity(main.bodies);
      for (let i in main.bodies) {
        let body = main.bodies[i];
        if(!indicateDistantObjects){
          body.mesh.children[1].visible = false;
        }else{
          body.mesh.children[1].visible = true;
        }
        if (!body.toDestroy) {
          let mesh = body.mesh;
          let coord = transformInScreenCoord(body.position);
          
          mesh.position.x = coord.x;
          mesh.position.y = coord.y;
          mesh.position.z = coord.z;
        } else {
          main.remove(body);
        }
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
          let intersect = raycaster.intersectObject(body.mesh.children[1]);
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
          main.mouseDrag = true;
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
        main.mouseDrag = false;
        if(main.creation){
          main.creation = false;
          pauseSim = false;
          let newPlanet = new Body(main.newName, main.newMass, main.newRadius,
                        [newBody.position.x / 100, 
                         newBody.position.y / 100, 
                         newBody.position.z / 100],
                        [dragVector.x / 3652.5, 
                         dragVector.y / 3652.5, 
                         dragVector.z / 3652.5], 0, 0x00ff00);
          main.bodies.push(newPlanet);
          addToScene(newPlanet);
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

  function updateColors(){
  //starColor = ['0xfff98e']
  // mercur, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto
  //planetsColor = ['0x8C8A8C', '0xCDC9C3', '0x0085AB', '0xD76720', '0xD5B67B',
  //'0xB5976B', '0x51E6EA', '0x015596', '0xC4A087']
    for (let i in main.bodies){
      let body = main.bodies[i];
      if(body.name=="Sun"){
        body.color = 0xfff98e;
      }else if(body.name=="Mercur"){
        body.color = 0x8c8a8c;
      }else if(body.name=="Venus"){
        body.color = 0xEFE16C;
      }else if(body.name=="Earth"){
        body.color = 0x0085ab;
      }else if(body.name=="Mars"){
        body.color = 0xd76720;
      }else if(body.name=="Jupiter"){
        body.color = 0xd5b67b;
      }else if(body.name=="Saturn"){
        body.color = 0xb5976b;
      }else if(body.name=="Uranus"){
        body.color = 0x51e6ea;
      }else if(body.name=="Neptune"){
        body.color = 0x015596;
      }else if(body.name=="Pluto"){
        body.color = 0xc4a087;
      }else if(body.name=="Moon"){
        body.color = 0x4E4D4D;
      }
    }
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
  return new THREE.Vector3(r[0]*scale, r[1]*scale, r[2]*scale);
}


