import { defs, tiny } from "/common.js";

const { vec3, vec4, vec, color, Mat4, Light, Shape, Material, Shader, Texture, Scene } = tiny;

export class Obstacle {
  constructor(transform) {
    this.transform = transform;
    this.is_fractured = false;
    this.cube = new defs.Cube();
    this.fragments = [];
    this.material = new Material(new defs.Spotlight_Shader(), {
      color: color(0, 1, 0, 1),
      ambient: 1,
    });
  }

  move(speed, dt) {
    this.transform = this.transform.times(Mat4.translation(0, 0, speed * dt));
    if (this.is_fractured) {
      for (let i = 0; i < this.fragments.length; i++) this.fragments[i].move(speed, dt);
    }
  }

  has_collided(superman) {
    let x = this.transform[0][3],
      y = this.transform[1][3];
    if (Math.abs(superman.x - x) <= 2 && Math.abs(superman.y - y) <= 2) return true;

    return false;
  }

  fracture_at() {
    this.is_fractured = true;

    let left = this.transform[0][3];
    let bottom = this.transform[1][3];
    let front = this.transform[2][3];

    this.fragments = [];
    this.fragments.push(new Obstacle_Fragment(left, bottom, front, 1, 1, -1, -1));
    this.fragments.push(new Obstacle_Fragment(left + 1, bottom, front, 1, 1, 1, -1));
    this.fragments.push(new Obstacle_Fragment(left, bottom + 1, front, 1, 1, -1, 1));
    this.fragments.push(new Obstacle_Fragment(left + 1, bottom + 1, front, 1, 1, 1, 1));
  }

  draw(context, program_state) {
    if (!this.is_fractured) {
      this.cube.draw(context, program_state, this.transform, this.material);
    } else {
      for (let i = 0; i < this.fragments.length; i++)
        this.fragments[i].draw(context, program_state);
    }
  }
}

export class Obstacle_Fragment {
  constructor(left, bottom, front, width, height, vel_x, vel_y) {
    this.cube = new defs.Cube();
    this.material = new Material(new defs.Spotlight_Shader(), {
      color: color(1, 0, 0, 1),
      ambient: 0.9,
      specularity: 0.9,
      diffusivity: 0.5,
    });

    this.pos = { x: left, y: bottom, z: front };
    this.vel = { x: vel_x * 3, y: vel_y * 3, z: -4 };
    this.ang = { theta: 0, x: vel_x, y: -vel_y, z: 0 };
    this.width = width;
    this.height = height;
  }

  move(speed, dt) {
    this.pos.x += (this.vel.x / 10) * speed * dt;
    this.pos.y += (this.vel.y / 10) * speed * dt;
    this.pos.z += this.vel.z * speed * dt;
    this.ang.theta += (Math.PI / 60) * speed * dt;
  }

  draw(context, program_state) {
    let transform = Mat4.identity()
      .times(
        Mat4.translation(this.pos.x - this.width / 2, this.pos.y - this.height / 2, this.pos.z)
      )
      .times(Mat4.rotation(this.ang.theta, this.ang.x, this.ang.y, this.ang.z))
      .times(Mat4.scale(this.width / 2, this.height / 2, 0.1));
    this.cube.draw(context, program_state, transform, this.material);
  }
}
