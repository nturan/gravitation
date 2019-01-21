
    angular.module('gravitationApp', [])
        .controller('MainController', function ($scope) {
            let main = this;
            let scene, camera, renderer, controls;
            main.availableSpeeds = [{physLoop: 1,  stepSize: 1/365/30/24/60, name: "minutes per second"},
                                    {physLoop: 60, stepSize: 1/365/30/24/60, name: "hours per second"},
                                    {physLoop: 24, stepSize: 1/365/30/24,    name: "days per second"},
                                    {physLoop: 7,  stepSize: 1/365/30,       name: "weeks per second"},
                                    {physLoop: 30, stepSize: 1/365/30,       name: "months per second"},
                                    {physLoop: 52, stepSize: 7/365/30,       name: "years per second"}];
      //control variables
            var dragStart = new THREE.Vector3();
            var dragEnd = new THREE.Vector3();
            var dragVector = new THREE.Vector3();
            let mouseDrag = false;
            let pauseSim = false;
            main.bodiesListShown = false;
            let mouse = new THREE.Vector2();
      //time control variables
            let startCounter = new Date().getTime();
            let frmTime = startCounter;
            let phsStart = startCounter;
            let phsTime = startCounter;
            let phsTicksPerSecond = 30;
            let phsCycle = 1000/phsTicksPerSecond;
            let frmCounter = 0;
            let trajLength = 100;//just array length, calculating real time too complicated
            let trajUpdateCounter = 0;
            let trajUpdateFreq = 1; // phys Ticks

      // creation plane
            let plgeometry = new THREE.PlaneGeometry(100000, 100000);
            let plmaterial = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide});
            let planeZ = new THREE.Mesh(plgeometry, plmaterial);
      // newBody
            let nBgeometry = new THREE.IcosahedronGeometry(3, 2);
            let nBmaterial = new THREE.MeshPhongMaterial({
                color: 0x000000,
                emissive: 0x072534,
                side: THREE.DoubleSide,
                shading: THREE.FlatShading
            });
      //Speed vector
            let speedArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0),
                                                   new THREE.Vector3(0, 0, 0),
                                                   100, 0xff0000);



            speedArrow.name = "speedArrow";
            let newBody = new THREE.Group();
            newBody.add(new THREE.Mesh(nBgeometry, nBmaterial));
            
            newBody.add(speedArrow);
            newBody.name = "newCreation";
      
      //axis
            let axisHelper = new THREE.AxesHelper(500);
            axisHelper.name = "AxisHelper";

            this.toggleAxes = function () {
                if (main.showAxes)
                    scene.add(axisHelper);
                else
                    scene.remove(axisHelper);
            };
            
            let gridHelper = new THREE.PolarGridHelper(5000, 50, 10, 50);
            gridHelper.rotation.x = Math.PI / 2;
            gridHelper.name = "PolarGrid";

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


            main.bodies = Ephemeris.bodies;
            main.add = function () {
                let color = parseInt('0x' + main.newColor);
                let body = new Body(main.newName, 
                                    main.newMass, 
                                    main.newRadius, 
                                    [main.newPositionX, main.newPositionY, main.newPositionX], 
                                    [main.newVelocityX, main.newVelocityY, main.newVelocityZ], 
                                    main.newAcceleration, color);
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
                    color: body.color,
                    emissive: 0x072534,
                    side: THREE.DoubleSide
                });
                body.mesh = new THREE.Object3D();
                // just for white lines on a body. could be just body.mesh = new THREE.Mesh(geometry, material);
                body.mesh.add(new THREE.LineSegments(new THREE.WireframeGeometry(geometry),
                                                     new THREE.LineBasicMaterial({color: 0xffffff,
                                                                                  transparent: true,
                                                                                  opacity: 0.5})));
                body.mesh.add(new THREE.Mesh(geometry, material));
                
                body.mesh.name = body.name;
                scene.add(body.mesh);

                let coord = transformInScreenCoord(body.position);
                body.mesh.position = new THREE.Vector3(coord.x, coord.y, coord.z);
            }

            main.track = function (body) {
                main.tracking = body;
            };

            init();
            animate();

            function init() {

                scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.001, 100000);
                camera.position.set(500, -500, 500);
                
                main.simSpeed = main.availableSpeeds[3];
                camera.up.set( 0, 0, 1 );
                for (let i in main.bodies) {
                    addToScene(main.bodies[i])
                }

                //Lights
                let light1 = new THREE.PointLight(0xffaaaa, 2, 0, 0);

                light1.position.set(0, 0, 0);
                // light1.color.setHSL( 0.55, 0.9, 0.5 );
                scene.add(light1);

                let light2 = new THREE.AmbientLight(0x333333);
                scene.add(light2);                

                renderer = new THREE.WebGLRenderer({antialias: true});
                renderer.setSize(window.innerWidth, window.innerHeight);

                document.body.appendChild(renderer.domElement);

                //Ich wuerde unsere eigene Control Funktion schreiben. Das ist unhandlich
                controls = new THREE.OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 1;
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
                }


                if (main.tracking) {
                    let pos = main.tracking.mesh.position;
//                     camera.position.set(pos.x+100, pos.y+100, pos.z+100);
                    controls.target = new THREE.Vector3(pos.x, pos.y, pos.z);
//                     gridHelper.position.x = pos.x;
//                     gridHelper.position.y = pos.y;
                    controls.update();
                }
                if (main.creation && !main.mouseDrag) {
                    newBody.position.x = pickVector3FromScene(planeZ, mouse, camera).x;
                    newBody.position.y = pickVector3FromScene(planeZ, mouse, camera).y;
                    newBody.position.z = pickVector3FromScene(planeZ, mouse, camera).z;
                    controls.enabled = false;
                    controls.update();
                } else if( main.creation && main.mouseDrag ){
                    dragEnd = pickVector3FromScene( planeZ, mouse, camera );
                    dragVector = dragEnd.sub( dragStart );
                    main.newVelocity = Gravity.magnitudeVec3([dragVector.x/10,
                                                              dragVector.y/10,
                                                              dragVector.z/10]);
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
                if (main.bodiesListShown && apply)
                    $scope.$apply();
                renderer.render(scene, camera);
            }

      
            function distantObjectIndication(){
              for (let i in main.bodies){
                let body = main.bodies[i];
                let coord = transformInScreenCoord(body.position);
                let distVec = [coord.x - camera.position.x,
                               coord.y - camera.position.y,
                               coord.z - camera.position.z];
                let distMag = Gravity.magnitudeVec3(distVec);
                let scaleFaktor = 2/body.mesh.children[1].geometry.parameters.radius;
                if (distMag>100){
                  body.mesh.scale.set(scaleFaktor, scaleFaktor, scaleFaktor);
                }else if (distMag > 30 && body.name != "Sun"){
                  body.mesh.scale.set(scaleFaktor/10, scaleFaktor/10, scaleFaktor/10);
                }else {
                  body.mesh.scale.set(1, 1, 1);
                }
              }
            }

            function updateTraj(){
              for (let i in main.bodies){
                let body = main.bodies[i];
                let traj = body.traj;
                let coord = transformInScreenCoord(body.position);
                traj.push(new THREE.Vector3(coord.x, coord.y, coord.z ));
                
                if(traj.length > trajLength){
                  traj.shift();    
                }
                if(traj.length > 3){
                  let trajCurve = new THREE.CatmullRomCurve3( traj );
                  var trajPoints = trajCurve.getPoints( trajLength );
                  var trajGeometry = new THREE.BufferGeometry().setFromPoints( trajPoints );
                  var trajMaterial = new THREE.LineBasicMaterial( {color: 0xffffff} );
                  let trajObj = body.trajObj;
                  scene.remove(trajObj);
                  trajObj = new THREE.Line( trajGeometry, trajMaterial );
                  scene.add(trajObj);
                  body.trajObj = trajObj;
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
                              let intersect = raycaster.intersectObject(body.mesh.children[1]);
                              if (intersect.length > 0) {
                                  main.track(body);
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
                          gridHelper.position.x = 0;
                          gridHelper.position.y = 0;
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
                        [newBody.position.x / 100, newBody.position.y / 100, newBody.position.z / 100],
                        [dragVector.x / 3652.5, dragVector.y / 3652.5, dragVector.z / 3652.5], 0, 0xff0000);
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
  
        function transformInScreenCoord(r) {
            return {x: r[0] * 100, y: r[1] * 100, z: r[2] * 100};
        }
