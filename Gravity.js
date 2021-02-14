
import * as THREE from "https://unpkg.com/three/build/three.module.js";

let Gravity = {
  // constants
  G: 0.03765,
  eps: 1.0E-10,
  // controll variables
  paus_simulation: false,
  availableSpeeds: [{physics_loop: 1,
                     stepSize: 1/365/30/24/60, 
                      name: "minutes per second"},
                    {physics_loop: 1,
                      stepSize: 1/365/30/24, 
                      name: "hours per second"},
                    {physics_loop: 1,
                      stepSize: 1/365/30,    
                      name: "days per second"},
                    {physics_loop: 7,
                      stepSize: 1/365/30,       
                      name: "weeks per second"},
                      {physics_loop: 30,
                        stepSize: 1/365/30,       
                        name: "months per second"}],

  ApplyGravity: function (bodies) {
    let n = bodies.length;
    let barycenter = [0, 0, 0];
    let sysMass = 0;
    let x = []
    let masses = []
    for (let i = 0; i<n; i++){
      x.push(bodies[i].position.x);
      x.push(bodies[i].position.y);
      x.push(bodies[i].position.z);
      masses.push(bodies[i].mass);
    }
    let a_i = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      let r_i = [x[i*3 + 0], x[i*3 + 1], x[i*3 + 2]];
      let a_i = [0, 0, 0];
      for (let j = 0; j < n; j++) {
        if (i != j) {
          let a_ij = [0, 0, 0];
          let accMod = 0;
          let r_j = [x[j*3 + 0], x[j*3 + 1], x[j*3 + 2]];
          let diffVector = [r_j[0] - r_i[0],
                            r_j[1] - r_i[1],
                            r_j[2] - r_i[2]];

          let distance = Gravity.magnitudeVec3(diffVector) + Gravity.eps;
          let mass = masses[j];

          a_ij[0] = (Gravity.G * mass / Math.pow(distance, 3)) * diffVector[0];
          a_ij[1] = (Gravity.G * mass / Math.pow(distance, 3)) * diffVector[1];
          a_ij[2] = (Gravity.G * mass / Math.pow(distance, 3)) * diffVector[2];

          a_i[0] += a_ij[0];
          a_i[1] += a_ij[1];
          a_i[2] += a_ij[2];
        }
      }
      let gravity_force_on_i = {x: a_i[0]*masses[i], 
                                y: a_i[1]*masses[i], 
                                z: a_i[2]*masses[i]};
      bodies[i].physics_body.ApplyForce(gravity_force_on_i);
    }
  },		

  magnitudeVec3: function (vec){
      return Math.sqrt(Math.pow(vec[0], 2) 
                      +Math.pow(vec[1], 2) 
                      +Math.pow(vec[2], 2));
    }
};

export {Gravity};
