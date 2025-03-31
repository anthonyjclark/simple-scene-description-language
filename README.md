# Simple Scene Description Language

## TODO

- working on:
  - names inside scopes (e.g., joint a link names need to automatically get their parent name)
  - previously, this was handled manually using `self.`
  - extension is broken
  - need ability to create a new name programmatically
  - scope is broken (does not go into function calls correctly; only global and local there)

- allow anonymous (automatically labled items) with '_'
- add colors
- disallow multiple definitions of the same name
- fix output spacing (two spaces for first indentation instead of tab?)
- change to kebab-case from snake_case
- add an icon
- add an icon to the package.json file: "icon": "icon.png",
- extend existing object using 'with' keyword
- add including files
- run tests?
- documentation?
- add light and dark modes (both text and visualization)
- setup formatting
- visualize joints

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

| axis | three.js        | RotX  | ROS (body) | ROS (geo) | ROS (rpy) |
| ---- | --------------- | ----- | ---------- | --------- | --------- |
| x    | right   (red)   | right | forward    | east      | roll      |
| y    | up      (green) |       | left       | north     | pitch     |
| z    | forward (blue)  |       | up         | up        | yaw       |

- [three.js](https://discoverthreejs.com/book/first-steps/transformations/#coordinate-systems-world-space-and-local-space)
- [ROS](https://www.ros.org/reps/rep-0103.html#id19)
