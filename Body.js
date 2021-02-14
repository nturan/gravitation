import {PhysicsBody} from "./physics_engine/physics_body.js";
import * as THREE from "https://unpkg.com/three/build/three.module.js";

class Body {
  constructor(name, mass, radius,
              initial_position, initial_velocity, mesh=null) {
    this.name = name;
    this.mass = mass/18981.3;
    this.radius = radius*1E-6;//0.01AU = km*1E-6
    this.position = initial_position;
    this.velocity =   {x: initial_velocity.x*365.25,
                       y: initial_velocity.y*365.25,
                       z: initial_velocity.z*365.25};
    this.physics_body = new PhysicsBody(
      this.mass, this.position, this.velocity, 
      this.CalculateInertiaTensor.bind(this));
    this.color = 0xffffff;
    this.toDestroy = false;
    this.traj = [];
    this.trajObj = null;

    if (mesh == null){
      //construct mesh for the celestial body
      let geometry = new THREE.IcosahedronGeometry(this.radius, 2);
      let material = new THREE.MeshPhongMaterial({
        color: this.color, emissive: 0x072534
        });
      this.mesh = new THREE.Object3D();
      this.mesh.add(new THREE.Mesh(geometry, material));
    }else{
      this.mesh = mesh;
    }
    
    let coord = this.TransformInScreenCoord(this.position);
    this.mesh.position.x = coord.x;
    this.mesh.position.y = coord.y;
    this.mesh.position.z = coord.z;
    this.mesh.name = this.name;
  }


  formatPosition(n=2) {
    return Body.humanizeFloat(this.position.x, n)+", "
          +Body.humanizeFloat(this.position.y, n)+", "
          +Body.humanizeFloat(this.position.z, n)
  }

  formatVelocity(n=2) {
//    return Body.humanizeFloat(this.velocity[0], n)+", "
//          +Body.humanizeFloat(this.velocity[1], n)+", "
//          +Body.humanizeFloat(this.velocity[2], n)
    return Body.humanizeFloat(Math.sqrt(this.velocity.x*this.velocity.x+
                                        this.velocity.y*this.velocity.y+
                                        this.velocity.z*this.velocity.z));
  }

  formatAcceleration(n=2) {
    return Body.humanizeFloat(this.acceleration.x, n)+", "
          +Body.humanizeFloat(this.acceleration.y, n)+", "
          +Body.humanizeFloat(this.acceleration.z, n)
  }

  CalculateInertiaTensor(){
    let moment_of_inertia_sphere = 0.4*this.mass*this.radius*this.radius;
    return math.matrix([
      [moment_of_inertia_sphere, 0, 0],
      [0, moment_of_inertia_sphere, 0],
      [0, 0, moment_of_inertia_sphere]]);
  }

  TransformInScreenCoord(r, scale=100) {
    return new THREE.Vector3(r.x*scale, r.y*scale, r.z*scale);
  }

  static humanizeFloat(x, n=2) {
    if(x)
        return x.toFixed(n);//.replace(/\.?0*$/, '');
    return '0.00';
  }

}

function BuildPlanetMesh(radius, texture_file){
  radius *= 1.0E-6;
  let geometry = new THREE.IcosahedronGeometry(radius, 2);
  let texture = new THREE.TextureLoader().load(texture_file);
  let material = new THREE.MeshPhongMaterial({
    map: texture
    });

  return new THREE.Mesh(geometry, material).rotateX(math.PI/2);
}

//building mesh for sun
let sun_radius = 695500.0*1E-6;
let sun_color = 0xFCFEDC;
let sun_mesh = new THREE.Group();
//construct mesh for the celestial body
let sun_geometry = new THREE.IcosahedronGeometry(sun_radius, 2);
let sun_texture = new THREE.TextureLoader().load("resources/2k_sun.jpg");
let sun_material = new THREE.MeshPhongMaterial({
  color: sun_color, emissive: 0xFCFEDC, map: sun_texture
  });
sun_mesh.add(new THREE.Mesh(sun_geometry, sun_material));
let sun_light = new THREE.PointLight(0xffffff, 1, 0, 2);;
sun_light.position.set(0, 0, 0);
sun_mesh.add(sun_light);


let sun = new Body("Sun",19885440.0,695500.0,
{x: -1.139090933890510E-03 , y: 7.513548470174963E-03 ,z: -4.751221261400040E-05},
{x: -8.103340265234835E-06 , y: 1.531073076683503E-06 ,z:  2.093972966295105E-07}, sun_mesh);

//building mesh for earth

let ring_texture = new THREE.TextureLoader().load("resources/2k_saturn_ring_alpha.png");
//ring_texture.rotation = math.PI/2;
//ring_texture.updateMatrix();
let ring_geometry = new THREE.RingBufferGeometry(1.005*60300*1.0E-6, 60300*1.0E-6*1.305, 32);
let pos = ring_geometry.attributes.position;
let v3 = new THREE.Vector3();
for (let i =0; i < pos.count; i++){
  v3.fromBufferAttribute(pos, i);
  ring_geometry.attributes.uv.setXY(i, v3.length() < 1.2*60300*1.0E-6 ? 0 : 1, 1);
}
let ring_material = new THREE.MeshPhongMaterial({
  map: ring_texture, transparent: true
});
let saturn_body = BuildPlanetMesh(54364, "resources/2k_saturn.jpg");
saturn_body.scale.copy(new THREE.Vector3(1.0, 0.9, 1));
let saturn_mesh = new THREE.Group();
saturn_mesh.add(saturn_body);
saturn_mesh.add(new THREE.Mesh(ring_geometry, ring_material));


let Ephemeris = {bodies : [
  sun, new Body("Mercur",3.302,2440,
 { x: 2.712325922922563E-01 , y: 1.819716677932228E-01 , z: -1.077866088275325E-02},
 { x:-2.069213447486702E-02 , y: 2.492058633634082E-02 , z:  3.933933861696485E-03},
 BuildPlanetMesh(2440, "resources/2k_mercury.jpg"))
 ,new Body("Venus",48.685,6052,
 { x: -5.728936053119389E-01 , y: -4.341301111844528E-01 ,z:  2.688719930686330E-02},
 { x:  1.221413056525722E-02 , y: -1.610029029497521E-02 ,z: -9.260442405719175E-04},
 BuildPlanetMesh(6052, "resources/2k_venus_atmosphere.jpg"))
 ,new Body("Earth",59.7219,6371,
 {x: -8.461345399508943E-01 , y:  5.198188201638625E-01 , z: -6.874116231359140E-05},
 {x: -9.202068150470241E-03 , y: -1.477025937149794E-02 , z:  2.181018061038459E-07},
 BuildPlanetMesh(6371, "resources/2k_earth_daymap.jpg"))
 ,new Body("Mars",6.4185,3390,
 {x:  5.705339438331232E-01 , y: 1.409846673537129E+00 , z: 1.530908608548376E-02},
 {x: -1.243732896484183E-02 , y: 6.474674548082186E-03 , z: 4.408245110899003E-04},
 BuildPlanetMesh(3390, "resources/2k_mars.jpg"))
 ,new Body("Jupiter",18981.3,69911,
 {x: -1.802834401723843E+00 , y: -5.014280704579202E+00 , z:  6.112364485199881E-02},
 {x:  7.010448905955205E-03 , y: -2.193302255507297E-03 , z: -1.477170884740540E-04},
 BuildPlanetMesh(69911, "resources/2k_jupiter.jpg"))
 ,new Body("Saturn",5683.19,54364,
 {x: 2.206030955119386E+00 , y: -9.805055204585239E+00 , z:  8.267037770574978E-02},
 {x: 5.134836863993126E-03 , y:  1.207623115706131E-03 , z: -2.256603441981650E-04},
 saturn_mesh)
 ,new Body("Uranus",868.103,24973,
{x:  1.691576531998510E+01 , y: 1.040299290535852E+01 , z: -1.805089997039230E-01},
{x: -2.089225716511510E-03 , y: 3.166920117890191E-03 , z:  3.877872984759312E-05},
BuildPlanetMesh(24973, "resources/2k_uranus.jpg"))
,new Body("Neptune",1024,24342,
{x: 2.901792701698493E+01 , y: -7.334322263086601E+00 , z: -5.177112691425811E-01},
{x: 7.480486820282755E-04 , y:  3.061681026453200E-03 , z: -8.041857175667311E-05},
BuildPlanetMesh(24342, "resources/2k_neptune.jpg"))
,new Body("Pluto",0.1307,1195,
{x: 1.202593741257323E+01 , y: -3.151923742551384E+01 , z: -1.058521747038058E-01},
{x: 3.011947033149633E-03 , y:  4.602992991939947E-04 , z: -9.262560073082725E-04})
,new Body("Moon",0.7349,1737,
{x: -8.475142757438984E-01 , y:  5.217790085293892E-01 , z: -3.489291919490877E-05},
{x: -9.707086464783627E-03 , y: -1.514846336243542E-02 , z:  5.686804539964647E-05},
BuildPlanetMesh(1737, "resources/2k_moon.jpg"))
,new Body("Io",0.8933,1821.3,
{x: -1.803461674299824E+00 , y: -5.017016066105317E+00 , z:  6.101532458745745E-02},
{x:  1.681093262738421E-02 , y: -4.425998369697550E-03 , z: -8.929365860245689E-05})
,new Body("Europa",0.4797,1565,
{x: -1.802718529157627E+00 , y: -5.009841513771999E+00 , z:  6.131122220507163E-02},
{x: -9.951954324951590E-04 , y: -1.990570620441508E-03 , z: -3.013171422482668E-04})
,new Body("Ganymede",1.482,2634,
{x: -1.803393500006158E+00 , y: -5.007138501949056E+00 , z:  6.138663186582697E-02},
{x:  7.577993506601293E-04 , y: -2.670678131208378E-03 , z: -2.497152309340046E-04})
,new Body("Callisto",1.076,2403,
{x: -1.792389695292648E+00 , y: -5.021172909160833E+00 , z: 6.104623329240919E-02},
{x:  9.615925658317278E-03 , y:  1.792745159721033E-03 , z: 1.303759011804029E-05})
,new Body("Mimas",0.000375,198.8,
{x: 2.206966977314742E+00 , y: -9.804420479623756E+00 , z:  8.221453673165265E-02},
{x:-2.595135014510252E-04 , y:  7.074468781161957E-03 , z: -2.908007177350689E-03})
,new Body("Enceladus",0.0010805,252.3,
{x: 2.204638276174967E+00 ,y: -9.804340379440230E+00 ,z:  8.243111278267680E-02},
{x: 1.697836985568966E-03 ,y: -4.385143468595405E-03 ,z:  3.038398441866367E-03})
,new Body("Tethys",0.006176,536.3,
{x:  2.205602840072827E+00 , y: -9.803331125560392E+00 , z: 8.181916434528755E-02},
{x: -1.227666348277735E-03 , y:  2.488559072102069E-04 , z: 1.030161338307698E-03})
,new Body("Dione",0.0109572,562.5,
{x: 2.208170227883550E+00 , y: -9.806316829148340E+00 , z:  8.312519452707669E-02},
{x: 8.177966907724791E-03 , y:  5.439796282238727E-03 , z: -2.739394017812531E-03})
,new Body("Rhea",0.02309,764.5,
{x: 2.205589073048511E+00 , y: -9.801937369011631E+00 , z: 8.108681075388574E-02},
{x: 2.907319229277102E-04 , y:  8.448026517563254E-04 , z: 4.026828776387365E-04})
,new Body("Titan",1.34553,2575.5,
{x: 2.199037116790120E+00 , y: -9.808740923776030E+00 , z: 8.526550701861015E-02},
{x: 6.880458180258838E-03 , y: -1.199004465277587E-03 , z: 8.411529200613504E-04})
,new Body("Iapetus",0.018059,734.5,
{x: 2.195986189899942E+00 , y: -9.825961895589282E+00 ,z:  8.953813277930124E-02},
{x: 6.801435775216020E-03 , y:  4.060803327326771E-04 ,z: -3.770615884942251E-04})
 ]};

 export {Ephemeris, Body};