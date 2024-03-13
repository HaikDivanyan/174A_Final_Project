import { defs, tiny } from "./common.js";
import { Board } from "./obstacle_board.js";
import { Shape_From_File } from "./shape-from-file.js";

const {
  Vector,
  Vector3,
  vec,
  vec3,
  vec4,
  color,
  hex_color,
  Shader,
  Texture,
  Matrix,
  Mat4,
  Light,
  Shape,
  Material,
  Scene,
} = tiny;

const numParticles = 25;

const particle = class particle {
  constructor(square, posZ, posY, color, velocity) {
    this.square = square;
    this.posZ = posZ;
    this.posY = posY;
    this.posX = 0.0;
    this.color = color;
    this.velocity = velocity;
    this.ambient = 1;
    this.transformed = false;
    this.storedMat;
  }

  update(program_state) {
    const t = program_state.animation_time / 1000,
      dt = program_state.animation_delta_time / 1000;

    this.posX += dt * this.velocity;
    if (this.posX < -3.5) {
      this.posX = 0.0;
      this.transformed = false;
    }

    this.color = color(1.0, (-1.0 * this.posX) / 4.5, 0.0, 1.0 + this.posX / 2);
  }
};

export class SupermanSimGame extends Scene {
  constructor() {
    super();

    this.particleSystem = [];

    for (let bint = 0; bint < numParticles; bint++) {
      let randPosZ = 0.6 * Math.random() - 0.3;
      let randPosY = 0.6 * Math.random() - 0.3;

      let randSpeedX = Math.random() * -5 - 5;
      this.particleSystem.push(
        new particle(new defs.Square(), randPosZ, randPosY, color(1.0, 0.0, 0.0, 1), randSpeedX)
      );
    }

    this.shapes = {
      square: new defs.Square(),
      skybox: new defs.Square(),
      text: new defs.Text_Line(30),
      cube: new defs.Cube(),
      cube_outline: new defs.Cube_Outline(),
      testCube: new defs.Cube(),
      ship: new defs.Square_Pyramid_Outline(),
      supermanModel: new Shape_From_File("assets/superman.obj"),
    };
    this.shapes.skybox.arrays.texture_coord.forEach((v) => {
      v[0] *= 1;
      v[1] *= 1;
    });

    this.materials = {
      basic: new Material(new defs.Basic_Shader()),
      color: new Material(new defs.Phong_Shader(), {
        ambient: 1,
        color: hex_color("#000000"),
      }),
      transparent: new Material(new defs.Phong_Shader(), {
        color: hex_color("#00000000"),
      }),
      suit: new Material(new defs.Textured_Phong(), {
        color: hex_color('#0047AB'),
        ambient: 0.9,
        diffusivity: 1,
        specularity: 1,
        texture: new Texture("assets/metal.jpg"),
      }),
      spotlight: new Material(new defs.Spotlight_Shader(), {
        color: hex_color("#000000"),
        ambient: 0.1,
      }),
      text_image: new Material(new defs.Textured_Phong(), {
        color: hex_color("#301934"),
        ambient: 0.4,
        diffusivity: .2,
        speculatrity: .2,
        texture: new Texture("assets/text.png"),
      }),
      space_skybox: new Material(new defs.Textured_Phong(), {
        ambient: 0.4,
        diffusivity: 0,
        specularity: 0,
        texture: new Texture("assets/2dbackdrop.jpg"),
      }),
    };

    this.initial_camera_location = Mat4.look_at(vec3(0, 3, 35), vec3(0, 0, 0), vec3(0, 1, 0));

    this.game_playing = false;
    this.game_speed = 0;
    this.boards = [];

    this.upArrowPressed = false;
    this.downArrowPressed = false;
    this.leftArrowPressed = false;
    this.rightArrowPressed = false;
    this.supermanSpeed = 30;
    this.supermanTurnSpeed = 3;
    this.supermanPosition = { x: 0, y: 0, z: 0 };
    this.supermanRotation = { horizontal: 0, vertical: 0, tilt: 0 };

    this.textPosition = { x: 0, y: 8, z: 10 };
    this.textScale = { x: 0.75, y: 0.75, z: 1 };

    this.score = 0;
  }

  make_control_panel() {
    this.key_triggered_button("Enter", ["Enter"], () => {
      if (!this.game_playing && this.score <= 0) {
        this.game_playing = true;
        this.game_speed = 80;
        for (let i = 0; i < 3; i++) {
          this.boards.push(new Board(-300 - 100 * i));
        }
      }
    });

    this.key_triggered_button(
      "Up",
      ["ArrowUp"],
      () => {
        this.upArrowPressed = true;
      },
      "#6E6460",
      () => {
        this.upArrowPressed = false;
      }
    );

    this.key_triggered_button(
      "Down",
      ["ArrowDown"],
      () => {
        this.downArrowPressed = true;
      },
      "#6E6460",
      () => {
        this.downArrowPressed = false;
      }
    );

    this.key_triggered_button(
      "Left",
      ["ArrowLeft"],
      () => {
        this.leftArrowPressed = true;
      },
      "#6E6460",
      () => {
        this.leftArrowPressed = false;
      }
    );

    this.key_triggered_button(
      "Right",
      ["ArrowRight"],
      () => {
        this.rightArrowPressed = true;
      },
      "#6E6460",
      () => {
        this.rightArrowPressed = false;
      }
    );
  }

  display(context, program_state) {
    let camera_inverse = Mat4.inverse(
      Mat4.translation(this.supermanPosition.x, this.supermanPosition.y, 0).times(
        Mat4.inverse(program_state.camera_inverse)
      )
    );

    program_state.set_camera(this.initial_camera_location);
    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      0.1,
      1000
    );

    const t = program_state.animation_time / 1000,
      dt = program_state.animation_delta_time / 1000;

    program_state.lights = [
      new Light(
        vec4(
          this.supermanPosition.x,
          this.supermanPosition.y,
          this.game_playing ? this.supermanPosition.z : this.supermanPosition.z + 50,
          1
        ),
        vec3(
          -Math.sin(this.supermanRotation.horizontal),
          Math.sin(this.supermanRotation.vertical),
          -5
        ),
        this.game_playing ? color(1.0, 1.0, 1.0, 1.0) : color(1.0, 0, 0, 1.0),
        this.game_playing ? 3500 : 100000,
        this.game_playing ? Math.PI / 3.155 : 0
      ),
    ];

    let text;
    if (this.game_playing) {
      text = Math.floor(this.score).toString();
      this.shapes.text.set_string(text, context.context);
    } else {
      if (this.score <= 0) {
        text = "ENTER TO START";
        this.shapes.text.set_string(text, context.context);
        this.shapes.text.draw(
          context,
          program_state,
          Mat4.translation(this.textPosition.x, this.textPosition.y, this.textPosition.z)
            .times(Mat4.scale(this.textScale.x, this.textScale.y, this.textScale.z))
            .times(Mat4.translation((text.length - 1) * -0.75, 0, 0)),
          this.materials.text_image
        );
      } else {
        text = "SUPERMAN LOOSES!";
        this.shapes.text.set_string(text, context.context);
        this.shapes.text.draw(
          context,
          program_state,
          Mat4.translation(this.textPosition.x, this.textPosition.y, this.textPosition.z)
            .times(Mat4.scale(this.textScale.x, this.textScale.y, this.textScale.z))
            .times(Mat4.translation((text.length - 1) * -0.75, 0, 0)),
          this.materials.text_image
        );
        text = "SCORE: " + Math.floor(this.score);
        this.shapes.text.set_string(text, context.context);
        this.shapes.text.draw(
          context,
          program_state,
          Mat4.translation(this.textPosition.x, this.textPosition.y - 4, this.textPosition.z)
            .times(Mat4.scale(this.textScale.x, this.textScale.y, this.textScale.z))
            .times(Mat4.translation((text.length - 1) * -0.75, 0, 0)),
          this.materials.text_image
        );
      }
    }

    program_state.set_camera(
      this.initial_camera_location.map((x, i) => Vector.from(camera_inverse[i]).mix(x, 0.6))
    );

    for (let i = 0; i < this.boards.length; i++) {
      this.boards[i].draw(context, program_state, this.game_speed, dt);
      if (!this.game_playing) continue;
      let collision = this.boards[i].check_collision(this.supermanPosition);

      if (collision != null) {
        collision.fracture_at(this.supermanPosition);
        this.game_playing = false;
      }
    }

    /* SETUP SUPERMAN */
    let supermanTransform = Mat4.identity()
      .times(
        Mat4.translation(this.supermanPosition.x, this.supermanPosition.y, this.supermanPosition.z)
      )
      .times(Mat4.rotation(Math.PI, 0, 1, 0))
      .times(Mat4.rotation(Math.PI / 2, 1, 0, 0))
      .times(Mat4.rotation(-Math.PI / 10, 1, 0, 0))
      .times(Mat4.rotation(this.supermanRotation.horizontal, 0, 1, 0))
      .times(Mat4.rotation(this.supermanRotation.vertical, 1, 0, 0))
      .times(Mat4.rotation(this.supermanRotation.tilt, 0, 0, 1));

    this.shapes.ship.draw(
      context,
      program_state,
      supermanTransform,
      this.materials.color.override({
        color: hex_color("#ff0000"),
        ambient: 1.0,
      })
    );
    this.shapes.supermanModel.draw(context, program_state, supermanTransform, this.materials.suit);

    this.shapes.skybox.draw(
      context,
      program_state,
      Mat4.translation(0, 0, -300).times(Mat4.scale(400, 400, 1)),
      this.materials.space_skybox
    );

    if (this.game_playing) {
      this.score += dt;
      this.high_score = Math.max(this.high_score, Math.floor(this.score));
      this.game_speed += dt * 2;
      if (this.upArrowPressed) {
        this.supermanPosition.y = Math.min(this.supermanPosition.y + this.supermanSpeed * dt, 12.0);
        this.supermanRotation.vertical = Math.max(
          this.supermanRotation.vertical - (Math.PI / 4) * this.supermanTurnSpeed * dt,
          -Math.PI / 4
        );
      }
      if (this.downArrowPressed) {
        this.supermanPosition.y = Math.max(this.supermanPosition.y - this.supermanSpeed * dt, -6.5);
        this.supermanRotation.vertical = Math.min(
          this.supermanRotation.vertical + (Math.PI / 4) * this.supermanTurnSpeed * dt,
          Math.PI / 4
        );
      }
      if (!this.upArrowPressed && !this.downArrowPressed) {
        if (Math.abs(this.supermanRotation.vertical) < 0.01) this.supermanRotation.vertical = 0;
        else this.supermanRotation.vertical -= this.supermanRotation.vertical * 5 * dt;
      }
      if (this.leftArrowPressed) {
        if (this.supermanRotation.horizontal < Math.PI / 4) {
          this.supermanRotation.horizontal += (Math.PI / 4) * this.supermanTurnSpeed * dt;
          this.supermanRotation.tilt += (Math.PI / 12) * this.supermanTurnSpeed * dt;
        }
      }
      if (this.rightArrowPressed) {
        if (this.supermanRotation.horizontal > -Math.PI / 4) {
          this.supermanRotation.horizontal -= (Math.PI / 4) * this.supermanTurnSpeed * dt;
          this.supermanRotation.tilt -= (Math.PI / 12) * this.supermanTurnSpeed * dt;
        }
      }
      if (!this.leftArrowPressed && !this.rightArrowPressed) {
        if (Math.abs(this.supermanRotation.horizontal) < 0.01) this.supermanRotation.horizontal = 0;
        else this.supermanRotation.horizontal -= this.supermanRotation.horizontal * 5 * dt;
        if (Math.abs(this.supermanRotation.tilt) < 0.01) this.supermanRotation.tilt = 0;
        else this.supermanRotation.tilt -= this.supermanRotation.tilt * 4 * dt;
      }
      this.supermanPosition.x -=
        this.supermanSpeed * Math.sin(this.supermanRotation.horizontal) * dt;
      this.supermanPosition.x = Math.max(this.supermanPosition.x, -8.5);
      this.supermanPosition.x = Math.min(this.supermanPosition.x, 8.5);
      this.supermanPosition.y += this.supermanSpeed * Math.sin(this.supermanRotation.vertical) * dt;
      this.supermanPosition.y = Math.max(this.supermanPosition.y, -6.5);
      this.supermanPosition.y = Math.min(this.supermanPosition.y, 12.0);
    } else {
      this.game_speed > 1 ? (this.game_speed *= 0.15 ** dt) : (this.game_speed = 0);
    }
  }
}
