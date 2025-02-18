# Simple Scene Description Language

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

### Workflow

First install dependencies (if cloning): `npm install`

1. Update the grammar
    - Update `src/language/ssdl.langium`
2. Generate the AST
    - Run `npm run langium:generate`
    - This will create files in `src/generated`
3. Resolve cross-references
    - This may not be necessary for this project
4. Create validations
    - Update `src/language/ssdl-validator.ts`
    - Create validation rules for semantic errors
5. Create code generation
    - Update `src/cli/generator.ts`
    - Run `npm run langium:generate`
    - Run `npm run build`
6. Customize the CLI
    - Update `src/cli/main.ts`
    - (If needed) `chmod +x ./bin/cli.js`
    - Run `./bin/cli COMMAND [FILE] [OPTIONS]`
    - Example: `./bin/cli.js generateURDF examples/box.ssdl --destination examples/`
7. Customizing the web worker
    - Update `src/language/main-browser.ts`
    - Run `npm run build`
    - Run `npm run dev`
8. Customizing the VSCode extension
    - ?Run `npm run vscode:prepublish` (template does not match documentation)
    - ?Run `vsce package`
    - ?Install the package in VSCode

run tests?
documentation?
build for web: `npm run bundle`











## TODO

- Add mathjs
- Test browser version
- Add an icon
- Build app with https://gkjohnson.github.io/urdf-loaders/javascript/

## Editing the Grammar

From the root directory:

1. Edit the grammar file in `src/language/ssdl.langium`
2. Run `npm run langium:generate`

## Build and Verify Working CLI

From the root directory:

1. (If needed) run `npm run langium:generate`
2. Run `npm run build`
3. (If needed) create a test file
4. (If needed) make the cli executable `chmod +x ./bin/cli.js`
5. Run `./bin/cli.js validate examples/default_box.ssdl`

## Building for Web

```bash
npm run build:web
```

## Building the VSCode Extension

```bash
npm run vscode:prepublish
vsce package
# Then right-click and install package (same for reinstall)
```

TODO: add an icon to the package.json file

```json
{
    ...
    "name": "minilogo",
    "displayName": "minilogo",
    "icon": "icon.png",
    "publisher": "TypeFox",
    ...
}
```

## Development

```bash
npm run langium:generate
npm run build
npm run build:web
npm run vscode:prepublish
vsce package
```

## Converting to URDF

```bash
./bin/cli.js generateURDF examples/default_box.ssdl
```

## Testing Output

1. Run `check_urdf examples/default_box.urdf` (requires ROS)

## Thoughts

- Extend existing object using 'with' keyword
- Add including files

## Formats

- Chrono: URDF, OpenSim, Adams
- DART: SKEL/SDF
- MuJoCo: MJCF, URDF
- NVIDIA Omniverse: USD???

- [SDFormat](http://sdformat.org/)
- [URDF](http://wiki.ros.org/urdf)
- [XACRO](http://wiki.ros.org/xacro)
- [SKEL File Format (SDF)](https://dartsim.github.io/skel_file_format.html)
- [MJCF modeling language](https://mujoco.readthedocs.io/en/latest/XMLreference.html)
- [USD (Universal Scene Description)](https://openusd.org/release/index.html)
- OpenSim format
- MSC Adams (Automatic Dynamic Analysis of Mechanical Systems) (`.adm`)
