Gravity = {
  G: 0.03765,
  step: 1/3650,
  eps: 1.0E-10,

  calculateGravity: function (bodies) {
    let n = bodies.length;
    let barycenter = [0, 0, 0];
    let sysMass = 0;
    let stateVector = []
    let masses = []
    for (let i = 0; i<n; i++){
      stateVector.push(bodies[i].position[0]);
      stateVector.push(bodies[i].position[1]);
      stateVector.push(bodies[i].position[2]);
      stateVector.push(bodies[i].velocity[0]);
      stateVector.push(bodies[i].velocity[1]);
      stateVector.push(bodies[i].velocity[2]);
      masses.push(bodies[i].mass);
    }
//    console.log(stateVector);
    stateVector = integrator.rk4(Gravity.dXdt, math.matrix(stateVector), 
                                 0, 
                                 Gravity.step, masses);
    for (let i = 0; i < n; i++) {
      let body = bodies[i];
      body.position[0] = stateVector._data[i*6+0];
      body.position[1] = stateVector._data[i*6+1];
      body.position[2] = stateVector._data[i*6+2];
      body.velocity[0] = stateVector._data[i*6+3];
      body.velocity[1] = stateVector._data[i*6+4];
      body.velocity[2] = stateVector._data[i*6+5];
      barycenter[0] += body.mass*body.position[0];
      barycenter[1] += body.mass*body.position[1];
      barycenter[2] += body.mass*body.position[2];
      sysMass += body.mass;
    }
    barycenter[0] = barycenter[0]/sysMass;
    barycenter[1] = barycenter[1]/sysMass;
    barycenter[2] = barycenter[2]/sysMass;
    for (let i = 0; i < n; i++) {
      let body = bodies[i];
      body.position[0] -= barycenter[0];
      body.position[1] -= barycenter[1];
      body.position[2] -= barycenter[2];
    }
  },

  dXdt: function(t, x, arg){
    x = x._data;
    let n = x.length/6;
    let dxdt = [];
    for (let i = 0; i < n; i++) {
      let r_i = [x[i*6 + 0], x[i*6 + 1], x[i*6 + 2]];
//      console.log(r_i);
      let a_i = [0, 0, 0];
      for (let j = 0; j < n; j++) {
        if (i != j) {
          let a_ij = [0, 0, 0];
          let accMod = 0;
          let r_j = [x[j*6 + 0], x[j*6 + 1], x[j*6 + 2]];
          let diffVector = [r_j[0] - r_i[0],
                            r_j[1] - r_i[1],
                            r_j[2] - r_i[2]];

          let distance = Gravity.magnitudeVec3(diffVector) + Gravity.eps;
          let mass = arg[j];

          a_ij[0] = (Gravity.G * mass / Math.pow(distance, 3)) * diffVector[0];
          a_ij[1] = (Gravity.G * mass / Math.pow(distance, 3)) * diffVector[1];
          a_ij[2] = (Gravity.G * mass / Math.pow(distance, 3)) * diffVector[2];

          a_i[0] += a_ij[0];
          a_i[1] += a_ij[1];
          a_i[2] += a_ij[2];
        }
      }
      dxdt[i*6+0] = x[i*6+3];
      dxdt[i*6+1] = x[i*6+4];
      dxdt[i*6+2] = x[i*6+5];
      dxdt[i*6+3] = a_i[0];
      dxdt[i*6+4] = a_i[1];
      dxdt[i*6+5] = a_i[2];
    }
    return math.matrix(dxdt);
  },

  updateK: function (k1, val) {
    let half_spep = 0.5 * Gravity.step;

    let k2 = [k1[0] + half_spep * k1[0],
              k1[1] + half_spep * k1[1],
              k1[2] + half_spep * k1[2]];

    let k3 = [k1[0] + half_spep * k2[0],
              k1[1] + half_spep * k2[1],
              k1[2] + half_spep * k2[2]];

    let k4 = [k1[0] + Gravity.step * k3[0],
              k1[1] + Gravity.step * k3[1],
              k1[2] + Gravity.step * k3[2]];

    let sixth_step = Gravity.step / 6;

    return [val[0] + sixth_step * (k1[0] + 2 * k2[0] + 3 * k3[0] + k4[0]),
            val[1] + sixth_step * (k1[1] + 2 * k2[1] + 3 * k3[1] + k4[1]),
            val[2] + sixth_step * (k1[2] + 2 * k2[2] + 3 * k3[2] + k4[2])];
    },
		
    magnitudeVec3: function (vec){
      return Math.sqrt(Math.pow(vec[0], 2) 
                      +Math.pow(vec[1], 2) 
                      +Math.pow(vec[2], 2));
    }
};
