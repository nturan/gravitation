class Body {
	//hallo aray, danke turan, verpiss dich hicham
    constructor(name, mass, radius,
                position, velocity, acceleration = 0.0,
                color = 0xffffff, toDestroy = false,
								traj=[], trajObj=null) {
        this.name = name;
        this.mass = mass/18981.3;
        this.radius = radius;
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
    }

    formatPosition() {
        return Body.humanizeFloat(this.position[0])+", "
              +Body.humanizeFloat(this.position[1])+", "
              +Body.humanizeFloat(this.position[2])
    }

    formatVelocity() {
        return Body.humanizeFloat(this.velocity[0])+", "
              +Body.humanizeFloat(this.velocity[1])+", "
              +Body.humanizeFloat(this.velocity[2])
    }

    formatAcceleration() {
        return Body.humanizeFloat(this.acceleration[0])+", "
              +Body.humanizeFloat(this.acceleration[1])+", "
              +Body.humanizeFloat(this.acceleration[2])
    }

    static humanizeFloat(x, n=2) {
        if(x)
            return x.toFixed(n);//.replace(/\.?0*$/, '');
        return '0.00';
    }

}
