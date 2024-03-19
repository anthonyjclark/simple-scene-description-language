import type { Robot, Definition, Statement } from "../language/generated/ast.js";
import type { Expression, Vector3 } from "../language/generated/ast.js";
import type { Box, Cylinder } from "../language/generated/ast.js";
import type { Revolute } from "../language/generated/ast.js";

import { isConstantDef, isMacroDef } from "../language/generated/ast.js";
import { isBody, isBox, isCylinder } from "../language/generated/ast.js";
import { isJoint, isRevolute } from "../language/generated/ast.js";
import { isMacroCall } from "../language/generated/ast.js";
import { isBinaryExpression, isParenthesized, isNumberLiteral, isValueReference } from "../language/generated/ast.js";

import { extractDestinationAndName } from "./cli-util.js";
import { Generated, expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';

// TODO: need context to include link/join names for references (ie, parent and child)
type UserConstants = Map<string, number>;

export function generateSDF(robot: Robot, filePath: string, destination: string | undefined): string {
    throw new Error("Not implemented");
}

export function generateURDF(robot: Robot, filePath: string, destination: string | undefined): string {

    const data = extractDestinationAndName(filePath, destination);

    const generatedFilePath = `${path.join(data.destination, data.name)}.urdf`;

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }

    const result: string = generate(robot);

    fs.writeFileSync(generatedFilePath, result);

    return generatedFilePath;

}

function generate(robot: Robot): string {

    const constants = evaluateDefinitions(robot.definitions);

    const generatedNode = expandToNode`
        <?xml version="1.0"?>
        <robot name="${robot.name}">
            ${evaluateStatements(robot.statements, constants, robot.name)}
        </robot>
    `;

    return toString(generatedNode);

}

function evaluateDefinitions(definitions: Definition[]): UserConstants {

    const constants = new Map<string, number>();
    constants.set("pi", Math.PI);

    for (const definition of definitions) {

        if (isMacroDef(definition)) {

            // macros.set(definition.name, definition);
            // TODO: nothing to be done?

        } else if (isConstantDef(definition)) {

            constants.set(definition.name, evaluateExpression(definition.expression, constants));

        } else {

            throw new Error("evaluateDefinitions: Unreachable");

        }

    }

    return constants;

}

function evaluateStatements(statements: Statement[], constants: UserConstants, sname: string): Generated {

    // Creating a closure for joinToNode
    const evaluate = (s: Statement) => evaluateStatement(s, constants, sname);

    return expandToNode`
        ${joinToNode(statements, evaluate, { appendNewLineIfNotEmpty: true })}
    `;

}

function evaluateStatement(statement: Statement, constants: UserConstants, sname: string): Generated {

    if (isBody(statement)) {

        const name = statement.self ? `${sname}_${statement.name}` : statement.name;

        if (isBox(statement.shape)) {

            return evaluateBox(statement.shape, name, constants);

        } else if (isCylinder(statement.shape)) {

            return evaluateCylinder(statement.shape, name, constants);

        } else {

            throw new Error(`Unhandled shape: ${statement.shape.$type}`);

        }

    } else if (isJoint(statement)) {

        const name = statement.self ? `${sname}_${statement.name}` : statement.name;

        if (isRevolute(statement.jtype)) {

            return evaluateRevolute(statement.jtype, name, sname, constants);

        } else {

            throw new Error(`Unhandled joint type: ${statement.jtype}`);

        }

    } else if (isMacroCall(statement)) {

        const macro = statement.macro.ref;

        if (!macro) {
            throw new Error(`Undefined macro: ${statement.macro.ref?.name}`);
        }

        const params = macro.parameters;
        const args = statement.arguments;

        if (args.length !== params.length) {
            // TODO: give line number
            throw new Error(`Macro definition and its call have different number of arguments: ${statement.name}`);
        }

        const scopedConstants = new Map<string, number>(constants);

        for (let i = 0; i < args.length; i += 1) {
            scopedConstants.set(params[i].name, evaluateExpression(args[i], scopedConstants));
        }

        return evaluateStatements(macro.body, scopedConstants, statement.name);

    } else {

        throw new Error("evaluateStatement: Unreachable");

    }

}

type Shape = Box | Cylinder;
function evaluateShape(name: string, geometry: string, shape: Shape, constants: UserConstants): Generated {
    // TODO:
    // - visual: material
    // - collision (same geometry as visual)
    // - inertial: mass, origin, inertia
    return expandToNode`
        <link name="${name}">
            <visual>
                ${poseToString(shape.position, shape.rotation, constants)}
                <geometry>
                    ${geometry}
                </geometry>
            </visual>
        </link>`;
}

function evaluateBox(box: Box, name: string, constants: UserConstants): Generated {

    const size = vector3ToString(box.size, constants) ?? "1 1 1";
    const boxGeometry = `<box size="${size}" />`;

    return evaluateShape(name, boxGeometry, box, constants);

}

function evaluateCylinder(cylinder: Cylinder, name: string, constants: UserConstants): Generated {

    const radius = cylinder.radius ? evaluateExpression(cylinder.radius, constants) : 1;
    const length = cylinder.length ? evaluateExpression(cylinder.length, constants) : 1;
    const cylinderGeometry = `<cylinder radius="${radius}" length="${length}" />`;

    return evaluateShape(name, cylinderGeometry, cylinder, constants);

}

function evaluateRevolute(revolute: Revolute, name: string, sname: string, constants: UserConstants): Generated {

    const child = revolute.child;
    const child_name = child.self ? `${sname}_${child.name}` : child.name;

    const parent = revolute.parent;
    const parent_name = parent.self ? `${sname}_${parent.name}` : parent.name;

    // <limit effort="30" velocity="1.0" lower="-2.2" upper="0.7" />

    // TODO:
    // - limit: effort, velocity, lower, upper
    return expandToNode`
        <joint name="${name}" type="revolute">
            <parent link="${parent_name}"/>
            <child link="${child_name}"/>
            ${poseToString(revolute.position, revolute.rotation, constants)}
            ${axisToString(revolute.axis, constants)}
            ${limitsToString(revolute, constants)}
        </joint>`;

}

function evaluateExpression(expression: Expression, constants: UserConstants): number {

    if (isNumberLiteral(expression)) {

        return expression.value;

    } else if (isValueReference(expression)) {

        const value = constants.get(expression.name);

        if (value === undefined) {
            throw new Error(`Undefined reference: ${expression.name}`);
        }

        return value;

    } else if (isParenthesized(expression)) {

        return evaluateExpression(expression.expression, constants);

    } else if (isBinaryExpression(expression)) {

        const operator = expression.op;
        const lhs = evaluateExpression(expression.lhs, constants);
        const rhs = evaluateExpression(expression.rhs, constants);

        switch (operator) {
            case "+": return lhs + rhs;
            case "-": return lhs - rhs;
            case "*": return lhs * rhs;
            case "/": return lhs / rhs;
            default: throw new Error(`Unhandled binary operator: ${operator}`);
        }

    } else {

        throw new Error("Should not get here");

    }
}

function vector3ToString(v3: Vector3 | undefined, constants: UserConstants): string | undefined {

    if (!v3) {
        return undefined;
    }

    const a = evaluateExpression(v3.a, constants);
    const b = evaluateExpression(v3.b, constants);
    const c = evaluateExpression(v3.c, constants);

    return v3 ? `${a} ${b} ${c}` : undefined;

}

function poseToString(position: Vector3 | undefined, rotation: Vector3 | undefined, constants: UserConstants): Generated {

    let pos = vector3ToString(position, constants);
    let rot = vector3ToString(rotation, constants);

    if (pos || rot) {
        pos ??= "0 0 0";
        rot ??= "0 0 0";
        return expandToNode`<origin xyz="${pos}" rpy="${rot}"/>`;
    } else {
        return undefined;
    }

}

function axisToString(axis: Vector3 | undefined, constants: UserConstants): Generated {

    const xyz = vector3ToString(axis, constants);
    return xyz ? expandToNode`<axis xyz="${xyz}" />` : undefined;

}

function limitsToString(revolute: Revolute, constants: UserConstants): Generated {

    const maxEffort = revolute.maxEffort ? evaluateExpression(revolute.maxEffort, constants) : 0;
    const maxVelocity = revolute.maxVelocity ? evaluateExpression(revolute.maxVelocity, constants) : 0;

    const lowerString = revolute.lowerAngleLimit ? `lower="${evaluateExpression(revolute.lowerAngleLimit, constants)}" ` : "";
    const upperString = revolute.upperAngleLimit ? `upper="${evaluateExpression(revolute.upperAngleLimit, constants)}" ` : "";

    return expandToNode`<limit ${lowerString}${upperString}effort="${maxEffort}" velocity="${maxVelocity}" />`;

}
