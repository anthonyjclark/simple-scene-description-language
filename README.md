# Simple Scene Description Language

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
