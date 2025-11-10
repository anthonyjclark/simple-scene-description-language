import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { configureWorker, defineUserServices } from './setupCommon.js';

import {
    AmbientLight,
    AxesHelper,
    Box3,
    Color,
    DirectionalLight,
    GridHelper,
    Mesh,
    MeshBasicMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    ShadowMaterial,
    WebGLRenderer,
} from "three";

import { FontLoader } from 'three/addons/loaders/FontLoader.js';;
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// @ts-ignore: ignoring the json import issue
import fontJson from "three/examples/fonts/helvetiker_regular.typeface.json";

import URDFLoader from "urdf-loader";

// const initialCode = `
// robot box

// let a = 4 cm

// b = Box {
//     size = 1, 2, 3
//     position = 0, 2, 0
// }
// `

// TODO: this should match the example in the file
const initialCode = `
//
// Name and configuration
//

name UGV

set visual_scale = 30
set snap_to_ground = true

//
// Constant definitions
//

let material_density =  0.940 g/cm^3

let chassis_length = 10 cm
let chassis_width = 16 cm
let chassis_height = 4 cm

let wheel_radius = 2.5 cm
let wheel_thickness = 1 cm

let extension_length = wheel_radius
let extension_width = wheel_thickness
let extension_thickness = wheel_thickness / 2

let num_extensions = 3
let extension_radial_offset = wheel_radius / 1.2
let extension_angle_offset = 20 deg

//
// Macro definitions
//

macro Extension(parentWheel, x, y, z, pitch) {
    body = Box {
        size = extension_length, extension_thickness, extension_width
        color = 1, 0, 0, 1
    }

    joint = Revolute {
        parent = parentWheel
        child = body
        position = x, y, z
        axis = 0, 1, 0
        lower = 0
        upper = pi
        effort = 10
        velocity = 10
    }
}

macro Wheel(reflect_fr, reflect_lr) {

    let x = chassis_length / 2 * reflect_fr
    let y = (wheel_thickness + chassis_width) / 2 * reflect_lr
    let z = 0

    body = Cylinder {
        length = wheel_thickness
        radius = wheel_radius
        rotation = pi/2, 0, 0
    }

    joint = Continuous {
        parent = chassis
        child = body
        position = x, y, z
        axis = 0, 1, 0
    }

    for i in num_extensions {
        let angle = 2 * pi * i / num_extensions

        let xi = extension_radial_offset * cos(angle)
        let yi = sign(reflect_lr) * (wheel_thickness + extension_thickness) / 2
        let zi = extension_radial_offset * sin(angle)

        let pitch = 90 deg - angle + extension_angle_offset

        extension = Extension(body, xi, yi, zi, pitch)
    }
}

//
// Links and joints
//

chassis = Box {
    size = chassis_length, chassis_width, chassis_height
    density = material_density
}

front_left_wheel = Wheel(1, -1)
front_right_wheel = Wheel(1, 1)
rear_left_wheel = Wheel(-1, -1)
rear_right_wheel = Wheel(-1, 1)
`

export const setupConfigExtended = (): UserConfig => {
    const extensionFilesOrContents = new Map();
    extensionFilesOrContents.set('/language-configuration.json', new URL('../language-configuration.json', import.meta.url));
    extensionFilesOrContents.set('/ssdl-grammar.json', new URL('../syntaxes/ssdl.tmLanguage.json', import.meta.url));

    return {
        wrapperConfig: {
            serviceConfig: defineUserServices(),
            editorAppConfig: {
                $type: 'extended',
                languageId: 'ssdl',
                code: initialCode,
                useDiffEditor: false,
                extensions: [{
                    config: {
                        name: 'ssdl-web',
                        publisher: 'generator-langium',
                        version: '1.0.0',
                        engines: {
                            vscode: '*'
                        },
                        contributes: {
                            languages: [{
                                id: 'ssdl',
                                extensions: [
                                    '.ssdl'
                                ],
                                configuration: './language-configuration.json'
                            }],
                            grammars: [{
                                language: 'ssdl',
                                scopeName: 'source.ssdl',
                                path: './ssdl-grammar.json'
                            }]
                        }
                    },
                    filesOrContents: extensionFilesOrContents,
                }],
                userConfiguration: {
                    json: JSON.stringify({
                        'workbench.colorTheme': 'Default Dark Modern',
                        'editor.semanticHighlighting.enabled': true,
                        "editor.fontSize": 16,
                    })
                }
            }
        },
        languageClientConfig: configureWorker()
    };
};



export const executeExtended = async (htmlElement: HTMLElement) => {
    const userConfig = setupConfigExtended();
    const wrapper = new MonacoEditorLanguageClientWrapper();
    await wrapper.initAndStart(userConfig, htmlElement);

    const client = wrapper.getLanguageClient();
    if (!client) throw new Error("Unable to obtain language client.");

    const timeoutIntervalMs = 800;
    let running = false;
    let timeout: NodeJS.Timeout | null = null;

    let renderer: WebGLRenderer;
    let rendererDiv: HTMLElement | null;
    let scene: Scene;
    let camera: PerspectiveCamera;
    let robot: any;

    const urdfDiv = document.getElementById("urdf-output");
    const urdfDownloadButton = document.getElementById("urdf-download");
    const jointResetButton = document.getElementById("joint-reset");

    // TODO: only allow download if there is valid content
    urdfDownloadButton?.addEventListener('click', () => {
        if (!urdfDiv) return;
        const urdfText = urdfDiv.innerText;
        const blob = new Blob([urdfText], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene.urdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    jointResetButton?.addEventListener('click', () => {
        if (robot === undefined) return;

        Object.keys(robot.joints).map(key => robot.joints[key]).forEach((joint: any) => {
            joint.setJointValue(0);
        });

        const jointSlidersList = document.getElementById("joint-sliders");
        if (jointSlidersList) {
            const rangeInputs = jointSlidersList.querySelectorAll<HTMLInputElement>('input[type="range"]');
            rangeInputs.forEach(input => {
                input.value = "0";
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        }
    });

    rendererInit();
    render();

    client.onNotification('browser/DocumentChange', (response: any) => {
        // Finish running the current task before processing new changes
        if (running) return;

        // Clear previous timeouts
        if (timeout) clearTimeout(timeout);

        timeout = setTimeout(async () => {
            running = true;
            const urdf = response.urdf;
            const config = response.config;
            const diagnostics = response.diagnostics;
            await updateUrdfView(urdf, config, diagnostics);
            running = false;
        }, timeoutIntervalMs);
    });

    function rendererInit() {
        scene = new Scene();
        scene.background = new Color(0x263238);

        camera = new PerspectiveCamera();
        camera.position.set(-10, 10, 10);
        camera.lookAt(0, 0, 0);

        renderer = new WebGLRenderer({ antialias: true });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = PCFSoftShadowMap;

        rendererDiv = document.getElementById("rendered-view");
        if (rendererDiv) rendererDiv.appendChild(renderer.domElement);
        else document.body.appendChild(renderer.domElement);

        const directionalLight = new DirectionalLight();
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.setScalar(1024);
        directionalLight.position.set(5, 30, 5);
        scene.add(directionalLight);

        const ambientLight = new AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);

        const groundScale = 20;
        const ground = new Mesh(new PlaneGeometry(), new ShadowMaterial({ opacity: 0.25 }));
        ground.rotation.x = -Math.PI / 2;
        ground.scale.setScalar(groundScale);
        ground.receiveShadow = true;
        scene.add(ground);

        const gridHelper = new GridHelper(groundScale, groundScale, 0x000000, 0x808080);
        scene.add(gridHelper);

        // TODO: the axis labels should always face the camera
        // TODO: should be configurable to turn off/on
        const fontLoader = new FontLoader();
        const font = fontLoader.parse(fontJson);
        const textMaterial = new MeshBasicMaterial({ color: 0xFAEBD7 });

        const createLabel = (text: string, position: [number, number, number]) => {
            const textGeometry = new TextGeometry(text, { font: font, size: 0.8, depth: 0.1 });
            const textMesh = new Mesh(textGeometry, textMaterial);
            textMesh.position.set(...position);
            scene.add(textMesh);
        };


        const axisOffset = groundScale / 5 + 0.5;
        // Account for the difference between three.js and URDF coordinate systems
        // https://github.com/gkjohnson/urdf-loaders/blob/32431e5be62c92cc0c4ce5b254ade31dbe545766/javascript/src/urdf-viewer-element.js#L586
        createLabel('X', [axisOffset, 0, 0]);
        createLabel('Y', [0, 0, -axisOffset]);
        createLabel('Z', [0, axisOffset, 0]);

        const axisHelper = new AxesHelper(groundScale / 2);
        axisHelper.position.y = 0.001;
        // Account for the difference between three.js and URDF coordinate systems
        // https://github.com/gkjohnson/urdf-loaders/blob/32431e5be62c92cc0c4ce5b254ade31dbe545766/javascript/src/urdf-viewer-element.js#L586
        axisHelper.rotateX(-Math.PI / 2);
        scene.add(axisHelper);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = 4;
        controls.target.y = 1;
        controls.update();
        rendererOnResize();
        window.addEventListener('resize', rendererOnResize);
    }

    function render() {

        requestAnimationFrame(render);
        renderer.render(scene, camera);

    }

    function rendererOnResize() {

        if (!rendererDiv) return;

        renderer.setSize(rendererDiv.offsetWidth, rendererDiv.offsetHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        camera.aspect = rendererDiv.offsetWidth / rendererDiv.offsetHeight;
        camera.updateProjectionMatrix();

    }

    // TODO: bring in types for config and diagnostics?
    function updateUrdfView(urdfString: string, config: Map<string, number | boolean>, diagnostics: any) {
        // TODO: show error messages in window

        if (urdfString === "") return;
        if (robot !== undefined) scene.remove(robot);

        const loader = new URDFLoader();

        // console.log(urdfString)

        try {
            robot = loader.parse(urdfString)
        } catch (error) {
            console.error("Error parsing URDF:", error);
            urdfDiv!.innerText = "Error parsing URDF.";
            return;
        }

        console.log(robot.frames)

        urdfDiv!.innerText = urdfString;
        // urdfDiv!.textContent = 'hello';
        // urdfDiv!.innerText = 'hello';

        // For better visualization:
        // - cast shadows
        // - scale up
        // - rotate to threejs coordinate system
        // - adjust position to ground plane

        robot.traverse((child: Mesh) => { child.castShadow = true; });

        const visualScale = config.get('visual_scale') ?? 1;
        robot.scale.setScalar(visualScale);

        robot.rotation.x = Math.PI / 2;

        if (config.get('snap_to_ground') === true) {
            const bb = new Box3();
            bb.setFromObject(robot);
            robot.position.y -= bb.min.y;
        }

        // Add joint sliders
        const jointSlidersList = document.getElementById("joint-sliders");
        jointSlidersList!.innerHTML = "";

        Object.keys(robot.joints).map(key => robot.joints[key]).forEach((joint: any) => {
            const li = document.createElement("li");
            const label = document.createElement("label");
            const input = document.createElement("input");
            li.appendChild(label);
            li.appendChild(input);
            jointSlidersList!.appendChild(li);

            label.textContent = joint.name;

            input.type = "range";
            // TODO: consider fixed and continuous joints
            input.min = `${-Math.PI}`;
            input.max = `${Math.PI}`;
            input.step = "0.01";
            input.value = "0";

            input.addEventListener("input", () => {
                const value = parseFloat(input.value);
                joint.setJointValue(value);
            });

        });

        scene.add(robot)

    }

};
