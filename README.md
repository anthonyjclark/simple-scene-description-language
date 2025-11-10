# Simple Scene Description Language

## TODO

- 2025-11-10
  - load ssdl files from URL (instead of embedding in `setupExtended.ts`)

- working on (2025-10-30):
  - [urdf-loaders documentation](https://gkjohnson.github.io/urdf-loaders/javascript/)
    - `URDFOptions`
      - `.parseVisual = true`
      - `.parseCollision = false`
    - `URDFJoint.mimicJoints: URDFMimicJoints[]`
    - `URDFRobot` (extends `URDFLink`)
      - `.links: map/set of...`
      - `.joints: map/set of...`
      - `.colliders: map/set of...`
      - `.visual: map/set of...`
      - `.frames: map/set of...`
  - default rotation for cylinder seems wrong
  - visualize frames
  - warn on unused parameters in SSDL
  - validate input range for colors (and others?)

- working on:
  - names inside scopes (e.g., joint a link names need to automatically get their parent name)
  - previously, this was handled manually using `self.`
  - extension is broken
  - need ability to create a new name programmatically
  - scope is broken (does not go into function calls correctly; only global and local there)
  - rendering viewport size (I made the render view nested and now the size is broken)
  - rendering the urdf output (I added the div and nothing else)
  - importing font... as json
  - using css grid doesn't seem to get the correct size

- [erasable js syntax](https://www.totaltypescript.com/erasable-syntax-only)
- let user adjust joint angles (robot.setJointValue(...))
- allow anonymous (automatically labeled items) with '_'
- add colors
- disallow multiple definitions of the same name
- fix output spacing (two spaces for first indentation instead of tab?)
- change to kebab-case from snake_case
- add an icon to the package.json file: "icon": "icon.png",
- extend existing object using 'with' keyword
- add including files
- run tests?
- documentation?
- add light and dark modes (both text and visualization)
- setup formatting
- visualize joints, CoMs, axes, collisions, etc. (look at rviz and Gazebo and mujoco)

- Recreate the tutorial: [Building a Visual Robot Model with URDF from Scratch](https://wiki.ros.org/urdf/Tutorials/Building%20a%20Visual%20Robot%20Model%20with%20URDF%20from%20Scratch)

- Update langium to latest
  - [langium/CHANGELOG.md](https://github.com/eclipse-langium/langium/blob/main/CHANGELOG.md)

## Development

### Start-Up

1. Have a node environment with version 16 or higher
2. Install `yo` and `generator-langium` globally

    ```bash
    npm install --global yo generator-langium
    ```

3. Scaffold a Langium project

    ```bash
    yo langium
    # Yes to running inside VSCode
    # Yes to adding a CLI
    # Yes to creating a web worker
    # Yes to setting up tests using Vitest
    ```

4. Install dependencies

    ```bash
    npm install --save three
    npm install --save-dev @types/three
    npm install --save urdf-loader
    ```

### Workflow

First install dependencies (if cloning): `npm install`

1. Update the grammar
    - Update `src/language/ssdl.langium`
2. Generate the AST
    - Run `npm run langium:generate`
    - This will create files in `src/generated`
3. Resolve cross-references
    - This may not be necessary for this project
4. Update validations
    - Update `src/language/ssdl-validator.ts`
    - Create validation rules for semantic errors
5. Update code generation
    - Update `src/cli/generator.ts`
    - Run `npm run langium:generate`
    - Run `npm run build`
6. Update and run the CLI
    - Update `src/cli/main.ts`
    - Run `npm run build`
    - (If needed) `chmod +x ./bin/cli.js`
    - Run `./bin/cli COMMAND [FILE] [OPTIONS]`
    - Example: `./bin/cli.js generateURDF examples/box.ssdl --destination examples/`
7. Develop the web version
    - Update `src/language/main-browser.ts` (send information to worker)
    - Update `src/setupExtended.ts` (handle URDF viewing)
    - Update `static/monacoExtendedWithUrdfLoader.html` (handle website)
    - Run `npm run build` (not needed?)
    - Run `npm run dev`
8. Deploy and test the web version
    - Run `npm run bundle`
    - Run `npm run bundle:serve`
    - Git and push to deploy
9. Customizing the VSCode extension
    - Run `npm run vscode:prepublish`
    - ?Run `vsce package`
    - ?Install the package in VSCode
    - ?Right-click and install package (same for reinstall)

```bash
magick ssdl-logo.png -background transparent -define icon:auto-resize=256,128,64,48,32,16 ssdl-logo.ico
```

## Testing Output

1. Run `check_urdf examples/default_box.urdf` (requires ROS)

## Formats

- Simulation engines and libraries
  - Chrono: URDF, OpenSim, Adams
  - DART: SKEL/SDF
  - MuJoCo: MJCF, URDF
  - NVIDIA Omniverse: USD???
- Some formats
  - [SDFormat](http://sdformat.org/)
  - [URDF](http://wiki.ros.org/urdf)
  - [XACRO](http://wiki.ros.org/xacro)
  - [SKEL File Format (SDF)](https://dartsim.github.io/skel_file_format.html)
  - [MJCF modeling language](https://mujoco.readthedocs.io/en/latest/XMLreference.html)
  - [USD (Universal Scene Description)](https://openusd.org/release/index.html)
  - OpenSim format
  - MSC Adams (Automatic Dynamic Analysis of Mechanical Systems) (`.adm`)

## Development Notes

### Coordinate Systems

| axis   | three.js        | RotX  | ROS (body) | ROS (geo) | ROS (rpy) | URDF  |
| ------ | --------------- | ----- | ---------- | --------- | --------- | ----- |
| handed | right           |       | right      | right     | right     | right |
| x      | right   (red)   | right | forward    | east      | roll      | into  |
| y      | up      (green) |       | left       | north     | pitch     | left  |
| z      | forward (blue)  |       | up         | up        | yaw       | up    |

- [Standard Units of Measure and Coordinate Conventions](https://www.ros.org/reps/rep-0103.html)
- [three.js](https://discoverthreejs.com/book/first-steps/transformations/#coordinate-systems-world-space-and-local-space)
- [URDFLoader.js](https://github.com/gkjohnson/urdf-loaders/blob/master/javascript/src/URDFLoader.js)

urdf-loaders

- "rotation direction is determined using the right-hand-rule as dictated by the URDF specification and ROS coordinate system."

### Link Reference

Reference [URDF XML Specification](https://wiki.ros.org/urdf/XML).

A note on origins:

- links can have separate origins for inertial, visual, and collision elements
  - these origins are relative to the link frame
  - by default, link frames are at the global origin
  - by default, inertial, visual, and collision origins are at the link frame origin
- joints have origins
  - joint origins do not affect the parent link frame
  - child links are positioned at the joint origin
  - joint origins are relative to the parent link frame (recursively)
  - rule of thumb: use a joint to position a child link relative to its parent link; use the child links origin to rotate
- visualize/debug with [urdf-viz](https://github.com/openrr/urdf-viz)
  - collision mode or visual mode
  - r for random joint positions
  - z to reset

- need to figure out:
  - how does origin affect inertia calculation?

```xml
<?xml version="1.0"?>
<?xml-model href="https://raw.githubusercontent.com/ros/urdfdom/master/xsd/urdf.xsd" ?>
<robot name="robot_name" xmlns="http://www.ros.org">
    (optional; multiple) <link name="link_name1">

        (optional) <inertial>
            (optional) <origin (optional) xyz="0 0 0" (optional) rpy="0 0 0" />
            <mass value="1" />
            <inertia ixx="0" ixy="0" ixz="0" iyy="0" iyz="0" izz="0" />
        </inertial>

        (optional; multiple) <visual (optional) name="visual_name1">
            (optional) <origin (optional) xyz="0 0 0" (optional) rpy="0 0 0" />
            <geometry>
                | <box size="1 1 1" />
                | <cylinder radius="1" length="1" />
                | <sphere radius="1" />
                | <mesh filename="path/to/mesh.dae" (optional) scale="1" />
            </geometry>
            (optional) <material (optional) name="material_name">
                (optional) <color (range [0,1]) rgba="1 1 1 1" />
                (optional) <texture filename="path/to/texture.png" />
            </material>
        </visual>

        (optional; multiple) <collision (optional) name="collision_name">
            (optional) <origin (optional) xyz="0 0 0" (optional) rpy="0 0 0" />
            <geometry>same specification as above</geometry>
        </collision>

    </link>

    (optional; multiple) <joint name="joint_name1" type="revolute|continuous|prismatic|fixed|floating|planar">

        (optional) <origin (optional) xyz="0 0 0" (optional) rpy="0 0 0" />
        <parent link="parent_link_name" />
        <child link="child_link_name" />
        (optional) <axis xyz="1 0 0" />
        (optional) <calibration (optional) rising="0" (optional) falling="0" />
        (optional) <dynamics (optional) damping="0.1" (optional) friction="0.1" />
        (required for revolute and prismatic) <limit (optional) lower="-1.57" (optional) upper="1.57" effort="10" velocity="1" />
        (optional) <mimic joint="other_joint_name" (optional) multiplier="1.0" (optional) offset="0.0" />
        (optional) <safety_controller (optional) soft_lower_limit="0" (optional) soft_upper_limit="0" (optional) k_position="0" k_velocity="0" />

    </joint>
```
