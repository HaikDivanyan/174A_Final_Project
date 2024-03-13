import { Obstacle } from "./obstacle.js";
import { tiny } from "/common.js";

const { vec3, vec4, vec, color, Mat4, Light, Shape, Material, Shader, Texture, Scene } = tiny;

export class Board {
  constructor(start_z) {
    this.patterns = [
      [1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1],
      [0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0],
      [0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0],
    ];

    this.pattern_index = Math.floor(Math.random() * this.patterns.length);
    this.z = start_z;
    this.obstacles = [];
    for (let i = 0; i < 25; i++) {
      this.obstacles.push(
        new Obstacle(
          Mat4.identity()
            .times(Mat4.rotation((45 * Math.PI) / 180, 0, 0, 1))
            .times(Mat4.translation(-8 + (i % 5) * 4, 11 - Math.floor(i / 5) * 4, this.z))
        )
      );
    }
  }

  move(speed, dt) {
    for (let i = 0; i < 25; i++) this.obstacles[i].move(speed, dt);
    this.z += speed * dt;
    if (this.z >= 50) this.reset();
  }
  reset() {
    this.z -= 300;
    this.pattern_index = Math.floor(Math.random() * this.patterns.length);
    for (let i = 0; i < 25; i++)
      this.obstacles[i].transform = this.obstacles[i].transform.times(Mat4.translation(0, 0, -300));
  }
  check_collision(superman) {
    if (Math.abs(this.z) > 1) return null;

    for (let i = 0; i < 25; i++) {
      if (
        this.patterns[this.pattern_index][i] == 1 &&
        !this.obstacles[i].is_fractured &&
        this.obstacles[i].has_collided(superman)
      )
        return this.obstacles[i];
    }

    return null;
  }

  draw(context, program_state, speed, dt) {
    this.move(speed, dt);
    for (let i = 0; i < 25; i++) {
      if (this.patterns[this.pattern_index][i] == 1) this.obstacles[i].draw(context, program_state);
    }
  }
}
