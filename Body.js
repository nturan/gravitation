class Body {
  //hallo aray, danke turan, verpiss dich hicham
  constructor(name, mass, radius,
              position, velocity, acceleration = 0.0,
              color = 0xffffff, toDestroy = false,
              traj=[], trajObj=null, mesh=null) {
    this.name = name;
    this.mass = mass/18981.3;
    this.radius = radius*1E-6;//0.01AU = km*1E-6
    this.position = position;
    velocity[0] = velocity[0]*365.25;
    velocity[1] = velocity[1]*365.25;
    velocity[2] = velocity[2]*365.25;
    this.velocity = velocity;
    this.color = color;
    this.acceleration = acceleration;
    this.toDestroy = toDestroy;
    this.traj = traj;
    this.trajObj = trajObj;
    this.mesh = mesh;
  }



  formatPosition(n=2) {
    return Body.humanizeFloat(this.position[0], n)+", "
          +Body.humanizeFloat(this.position[1], n)+", "
          +Body.humanizeFloat(this.position[2], n)
  }

  formatVelocity(n=2) {
//    return Body.humanizeFloat(this.velocity[0], n)+", "
//          +Body.humanizeFloat(this.velocity[1], n)+", "
//          +Body.humanizeFloat(this.velocity[2], n)
    return Body.humanizeFloat(Math.sqrt(this.velocity[0]*this.velocity[0]+
                                        this.velocity[1]*this.velocity[1]+
                                        this.velocity[2]*this.velocity[2]));
  }

  formatAcceleration(n=2) {
    return Body.humanizeFloat(this.acceleration[0], n)+", "
          +Body.humanizeFloat(this.acceleration[1], n)+", "
          +Body.humanizeFloat(this.acceleration[2], n)
  }

  static humanizeFloat(x, n=2) {
    if(x)
        return x.toFixed(n);//.replace(/\.?0*$/, '');
    return '0.00';
  }

}
