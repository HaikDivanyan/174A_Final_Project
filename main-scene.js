import { defs, tiny } from "./common.js";
import { SupermanSimGame } from "./supermanSim.js";
const {
  Vector,
  Vector3,
  vec,
  vec3,
  vec4,
  color,
  Matrix,
  Mat4,
  Light,
  Shape,
  Material,
  Shader,
  Texture,
  Scene,
  Canvas_Widget,
  Code_Widget,
  Text_Widget,
} = tiny;
Object.assign(defs, { SupermanSimGame: SupermanSimGame });
const Main_Scene = SupermanSimGame;
export { Canvas_Widget, Code_Widget, Main_Scene, Text_Widget, defs };
