import type { Robot } from "../language/generated/ast.js";
import chalk from "chalk";
import { Command } from "commander";
import { SsdlLanguageMetaData } from "../language/generated/module.js";
import { createSsdlServices } from "../language/ssdl-module.js";
import { extractAstNode, extractDocument } from "./cli-util.js";
import { generateSDF, generateURDF } from "./generator.js"
import { NodeFileSystem } from "langium/node";
import * as url from "node:url";
import * as fs from "node:fs/promises";
import * as path from "node:path";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const packagePath = path.resolve(__dirname, "..", "..", "package.json");
const packageContent = await fs.readFile(packagePath, "utf-8");

export const generateSDFAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {

    const services = createSsdlServices(NodeFileSystem).Ssdl;
    const scene = await extractAstNode<Robot>(fileName, services);
    const generatedFilePath = generateSDF(scene, fileName, opts.destination);
    console.log(chalk.green(`SDF generated: ${generatedFilePath}`));

};

export const generateURDFAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {

    const services = createSsdlServices(NodeFileSystem).Ssdl;
    const scene = await extractAstNode<Robot>(fileName, services);
    const generatedFilePath = generateURDF(scene, fileName, opts.destination);
    console.log(chalk.green(`URDF generated: ${generatedFilePath}`));

};

export const validateAction = async (fileName: string): Promise<void> => {

    const services = createSsdlServices(NodeFileSystem).Ssdl;
    const document = await extractDocument(fileName, services);
    const parseResult = document.parseResult;

    const numLexerErrors = parseResult.lexerErrors.length;
    const numParserErrors = parseResult.parserErrors.length;

    if (numLexerErrors === 0 && numParserErrors === 0) {

        console.log(chalk.green(`Parsed and validated ${fileName} successfully!`));

    } else {

        console.log(chalk.red(`Failed to parse and validate ${fileName}!`));

    }
};

export type GenerateOptions = {
    destination?: string;
};

export default function (): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    const fileExtensions = SsdlLanguageMetaData.fileExtensions.join(", ");

    program
        .command("generateSDF")
        .argument("<file>", `source file (possible file extensions: ${fileExtensions})`)
        .option("-d, --destination <dir>", "destination directory of generation")
        .description('Generates SDF')
        .action(generateSDFAction);

    program
        .command("generateURDF")
        .argument("<file>", `source file (possible file extensions: ${fileExtensions})`)
        .option("-d, --destination <dir>", "destination directory of generation")
        .description('Generates URDF')
        .action(generateURDFAction);

    program
        .command("validate")
        .argument("<file>", `Source file to parse & validate (ending in ${fileExtensions})`)
        .description("Indicates where a program parses & validates successfully, but produces no output code")
        .action(validateAction);

    program.parse(process.argv);
}
