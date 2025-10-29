import type { Robot } from "../language/generated/ast.js";
import { extractDestinationAndName } from "./cli-util.js";
import * as fs from 'node:fs';
import * as path from 'node:path';

import { generate } from "../language/generator.js";

export function generateMJCF(robot: Robot, filePath: string, destination: string | undefined): string {
    throw new Error("Not implemented");
}

export function generateSDF(robot: Robot, filePath: string, destination: string | undefined): string {
    throw new Error("Not implemented");
}

export function generateURDF(robot: Robot, filePath: string, destination: string | undefined): string {

    const data = extractDestinationAndName(filePath, destination);

    const generatedFilePath = `${path.join(data.destination, data.name)}.urdf`;

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }

    const [result, _] = generate(robot);

    fs.writeFileSync(generatedFilePath, result);

    return generatedFilePath;

}

export function generateUSD(robot: Robot, filePath: string, destination: string | undefined): string {
    throw new Error("Not implemented");
}
