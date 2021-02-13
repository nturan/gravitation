class Body {
  //hallo aray, danke turan, verpiss dich hicham
  constructor(name, mass, radius,
              initial_position, initial_velocity, acceleration = 0.0,
              color = 0xffffff, toDestroy = false,
              traj=[], trajObj=null, mesh=null) {
    this.name = name;
    this.mass = mass/18981.3;
    this.radius = radius*1E-6;//0.01AU = km*1E-6
    this.position = initial_position;
    initial_velocity[0] = initial_velocity[0]*365.25;
    initial_velocity[1] = initial_velocity[1]*365.25;
    initial_velocity[2] = initial_velocity[2]*365.25;
    this.acceleration = {x: 0, y: 0, z: 0};
    this.force = {x: 0, y: 0, z: 0};
    this.w = {x: 0, y: 0, z: 0};
    this.velocity = initial_velocity;
    this.inertiaTensor = this.calcInertiaTensor();
    this.quaternion = this.mesh.quaternion;
    this.L = math.multiply(this.inertiaTensor, [[this.w.x],
                                                [this.w.y],
                                                [this.w.z]]);

    this.euler = new THREE.Euler();
    this.euler.setFromQuaternion(this.quaternion);
    this.state_vector = [ this.position.x,
                          this.position.y,
                          this.position.z,
                          this.quaternion.x,
                          this.quaternion.y,
                          this.quaternion.z,
                          this.quaternion.w,
                          this.velocity.x*this.mass,
                          this.velocity.y*this.mass,
                          this.velocity.z*this.mass,
                          this.L._data[0][0],
                          this.L._data[1][0],
                          this.L._data[2][0]];
    this.color = color;
    this.toDestroy = toDestroy;
    this.traj = traj;
    this.trajObj = trajObj;
    this.mesh = mesh;
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

  calcInertiaTensor(){
    let moment_of_inertia_sphere = 0.4*this.mass*this.radius*this.radius;
    return math.matrix([
      [moment_of_inertia_sphere, 0, 0],
      [0, moment_of_inertia_sphere, 0],
      [0, 0, moment_of_inertia_sphere]]);
  }

  static humanizeFloat(x, n=2) {
    if(x)
        return x.toFixed(n);//.replace(/\.?0*$/, '');
    return '0.00';
  }



}
