// TODO: type check things like mass

import type { Robot, Configurations, Definition, Statement } from "./generated/ast.js";
import type { Expression, Vector3 } from "./generated/ast.js";
import type { Box, Cylinder } from "./generated/ast.js";
import type { Revolute } from "./generated/ast.js";

import { isConstantDef, isForLoop, isFunctionCall, isMacroDef } from "./generated/ast.js";
import { isBody, isBox, isCylinder } from "./generated/ast.js";
import { isJoint, isRevolute } from "./generated/ast.js";
import { isMacroCall } from "./generated/ast.js";
import { isBinaryExpression, isParenthesized, isNumberLiteral, isValueReference } from "./generated/ast.js";

import { Generated, expandToNode, joinToNode, toString } from 'langium/generate';

import { Unit, unit, add, subtract, multiply, divide, typeOf } from "mathjs";

// TODO: need context to include link/join names for references (ie, parent and child)
type Scope = Map<string, string | Unit | number>;
type Config = Map<string, number | boolean>;
type Shape = Box | Cylinder;
type Triple = [number, number, number];

export function generate(robot: Robot): [string, Config] {

	// Top level configuration
	const configurations = evaluateConfigurations(robot.configurations);

	// Top level definitions
	const scope = evaluateDefinitions(robot.definitions);

	// TODO: remove robot.name from call to evaluateStatements?
	const generatedNode = expandToNode`
			<?xml version="1.0"?>
			<robot name="${robot.name}">
					${evaluateStatements(robot.statements, scope, robot.name)}
			</robot>
	`;

	return [toString(generatedNode), configurations];

}

function evaluateConfigurations(configurations: Configurations[]): Config {
	const configMap = new Map<string, number | boolean>();

	for (const config of configurations) {

		if (config.name === "snap_to_ground") configMap.set(config.name, config.value === "true");
		else if (typeof config.value === "number") configMap.set(config.name, config.value);

	}

	return configMap;
}

function evaluateDefinitions(definitions: Definition[], scope?: Scope): Scope {

	if (!scope) scope = new Map<string, Unit | number>();

	// TODO: add other constants
	scope.set("pi", unit(Math.PI, "rad"));

	for (const definition of definitions) {

		if (isMacroDef(definition)) {

			// macros.set(definition.name, definition);
			// TODO: nothing to be done?

		} else if (isConstantDef(definition)) {

			scope.set(definition.name, evaluateExpression(definition.expression, scope));

		} else {

			throw new Error("evaluateDefinitions: Unreachable");

		}

	}

	return scope;

}

function evaluateStatements(statements: Statement[], scope: Scope, context: string): Generated {

	// Creating a closure for joinToNode
	const evaluate = (s: Statement) => evaluateStatement(s, scope, context);

	return expandToNode`
			${joinToNode(statements, evaluate, { appendNewLineIfNotEmpty: true })}
	`;

}

function evaluateStatement(statement: Statement, scope: Scope, context: string): Generated {

	if (isBody(statement)) {

		const name = `${context}_${statement.name}`;
		scope.set(statement.name, name);

		// All shapes must have a density
		const density = statement.shape.density ? evaluateExpressionAsNumber(statement.shape.density, scope, 'kg/m^3') : 1000;

		if (isBox(statement.shape)) {

			return evaluateBox(statement.shape, name, density, scope);

		} else if (isCylinder(statement.shape)) {

			return evaluateCylinder(statement.shape, name, density, scope);

		} else {

			throw new Error(`Unhandled shape: ${statement.shape.$type}`);

		}

	} else if (isJoint(statement)) {

		const name = `${context}_${statement.name}`;
		scope.set(statement.name, name);

		if (isRevolute(statement.jtype)) {

			return evaluateRevolute(statement.jtype, name, context, scope);

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
			// TODO: better error message
			throw new Error(`Macro definition and its call have different number of arguments: ${statement.name}`);
		}

		// Create a new scope for the macro call based on the current scope
		const macroCallScope = new Map<string, string | Unit | number>(scope);

		for (let i = 0; i < args.length; i += 1) {
			macroCallScope.set(params[i].name, evaluateExpression(args[i], scope));
		}

		// Evaluate definitions defined inside of the macro
		evaluateDefinitions(macro.definitions, macroCallScope);

		return evaluateStatements(macro.statements, macroCallScope, `${context}_${statement.name}`);

	} else if (isForLoop(statement)) {

		// Add the for loop variable to the scope
		const forLoopScope = new Map<string, string | Unit | number>(scope);

		let iterations = [];

		// TODO: I need to create an "evaluateBlock" function so that it handles scope, definitions, and statements
		const rangeMax = evaluateExpressionAsNumber(statement.range, scope);
		for (let i = 0; i < rangeMax; i++) {
			forLoopScope.set(statement.var, i);
			evaluateDefinitions(statement.definitions, forLoopScope);
			iterations.push(evaluateStatements(statement.statements, forLoopScope, `${context}_${i}`));
		}

		return joinToNode(iterations, { appendNewLineIfNotEmpty: true });

	} else {

		throw new Error("evaluateStatement: Unreachable");

	}
}

function evaluateShape(shape: Shape, name: string, mass: number, inertia: string, geometry: string, scope: Scope): Generated {
	// By default this will create a shape with inertial, visual, and collision elements

	const origin = createOriginElement(shape.position, shape.rotation, scope);

	// TODO: visual -> material
	// TODO: handle optional inertial, visual, and collision elements

	return expandToNode`
			<link name="${name}">
					<inertial>
							${origin}
							<mass value="${mass}" />
							<inertia ${inertia} />
					</inertial>
					<visual name="${name}-visual">
							${origin}
							<geometry>${geometry}</geometry>
					</visual>
					<collision name="${name}-collision">
							${origin}
							<geometry>${geometry}</geometry>
					</collision>
			</link>`;
}

function evaluateBox(box: Box, name: string, density: number, scope: Scope): Generated {

	// TODO: consider height width and length instead of size

	// NOTE: default box size is 1x1x1
	const [a, b, c] = box.size ? evaluateVector3(box.size, scope, 'm') : [1, 1, 1];

	const geom = `<box size="${a} ${b} ${c}" />`;

	const mass = a * b * c * density;

	const inertiaFactor = mass / 12;
	const ixx = inertiaFactor * (b ** 2 + c ** 2);
	const ixy = 0;
	const ixz = 0;
	const iyy = inertiaFactor * (a ** 2 + c ** 2);
	const iyz = 0;
	const izz = inertiaFactor * (a ** 2 + b ** 2);
	const inertia = `ixx="${ixx}" ixy="${ixy}" ixz="${ixz}" iyy="${iyy}" iyz="${iyz}" izz="${izz}"`;

	return evaluateShape(box, name, mass, inertia, geom, scope);

}

function evaluateCylinder(cylinder: Cylinder, name: string, density: number, scope: Scope): Generated {

	// NOTE: default cylinder radius and length are both 1
	const radius = cylinder.radius ? evaluateExpressionAsNumber(cylinder.radius, scope, 'm') : 1;
	const length = cylinder.length ? evaluateExpressionAsNumber(cylinder.length, scope, 'm') : 1;

	const geom = `<cylinder radius="${radius}" length="${length}" />`;

	const mass = Math.PI * radius ** 2 * length * density;

	// TODO: This assumes orientation of the cylinder is along the z-axis
	const ixx = (mass / 12) * (3 * radius ** 2 + length ** 2);
	const ixy = 0;
	const ixz = 0;
	const iyy = (mass / 12) * (3 * radius ** 2 + length ** 2);
	const iyz = 0;
	const izz = (mass / 2) * radius ** 2;
	const inertia = `ixx="${ixx}" ixy="${ixy}" ixz="${ixz}" iyy="${iyy}" iyz="${iyz}" izz="${izz}"`;

	return evaluateShape(cylinder, name, mass, inertia, geom, scope);

}

function evaluateRevolute(revolute: Revolute, name: string, context: string, scope: Scope): Generated {

	// console.log(`evaluateRevolute: ${name} (${context})`);
	// console.log(constants);

	// const parent = revolute.parent;
	// const parent_name = parent.self ? `${sname}_${parent.name}` : parent.name;
	// const parent_name = `${context}_${parent.name}` ;
	const parent_name = scope.get(revolute.parent) as string ?? revolute.parent;
	// console.log(`evaluateRevolute: ${name} ${parent_name} (${context})`);

	// const child = revolute.child;
	// const child_name = child.self ? `${sname}_${child.name}` : child.name;
	// const child_name = `${context}_${child.name}` ;
	const child_name = scope.get(revolute.child) as string ?? revolute.child;
	// console.log(`evaluateRevolute: ${name} ${child_name} (${context})`);

	// <limit effort="30" velocity="1.0" lower="-2.2" upper="0.7" />

	const axis =  revolute.axis ? expandToNode`<axis xyz="${vector3ToString(revolute.axis, scope)}" />` : undefined;

	// TODO:
	// - limit: effort, velocity, lower, upper
	return expandToNode`
			<joint name="${name}" type="revolute">
					<parent link="${parent_name}" />
					<child link="${child_name}" />
					${createOriginElement(revolute.position, revolute.rotation, scope)}
					${axis}
					${limitsToString(revolute, scope)}
			</joint>`;

}

function evaluateExpressionAsNumber(expression: Expression, scope: Scope, units?: string): number {

	const result = evaluateExpression(expression, scope);
	return typeof result === "number" ? result : result.toNumber(units);

}

// TODO: working on units
function evaluateExpression(expression: Expression, scope: Scope): Unit | number {

	if (isNumberLiteral(expression)) {

		return expression.units ? unit(expression.value, expression.units) : expression.value;

	} else if (isValueReference(expression)) {

		// TODO: Scoped reference
		const value = scope.get(expression.name) as Unit | number;

		if (value === undefined) {
			// TODO: don't throw an error; just skip to next statement
			throw new Error(`Undefined reference: ${expression.name}`);
		}

		return value;

	} else if (isParenthesized(expression)) {

		return evaluateExpression(expression.expression, scope);

	} else if (isBinaryExpression(expression)) {

		const operator = expression.op;
		const lhs = evaluateExpression(expression.lhs, scope);
		const rhs = evaluateExpression(expression.rhs, scope);

		// console.log(lhs);
		// console.log(rhs);
		// console.log(operator);

		switch (operator) {
			case "+": return checkedAdd(lhs, rhs);
			case "-": return checkedSub(lhs, rhs);
			case "*": return multiply(lhs, rhs) as (number | Unit);
			case "/": return divide(lhs, rhs) as (number | Unit);
			default: throw new Error(`Unhandled binary operator: ${operator}`);
		}

	} else if (isFunctionCall(expression)) {

		// const args = expression.arguments.map(arg => evaluateExpression(arg, scope));
		const argument = evaluateExpressionAsNumber(expression.argument, scope);

		// TODO: add additional function: copysign

		switch (expression.function) {
			case "abs": return Math.abs(argument);
			case "acos": return Math.acos(argument);
			case "asin": return Math.asin(argument);
			case "atan": return Math.atan(argument);
			case "cos": return Math.cos(argument);
			case "sin": return Math.sin(argument);
			case "tan": return Math.tan(argument);
			case "sign": return Math.sign(argument);
			default: throw new Error(`Unhandled function call: ${expression.function}`);
		}

	} else {

		throw new Error("Should not get here");

	}
}

function evaluateVector3(v3: Vector3, scope: Scope, units?: string): Triple {

	const a = evaluateExpressionAsNumber(v3.a, scope, units);
	const b = evaluateExpressionAsNumber(v3.b, scope, units);
	const c = evaluateExpressionAsNumber(v3.c, scope, units);

	return [a, b, c];
}

function vector3ToString(v3: Vector3, scope: Scope, units?: string): string {

	const [a, b, c] = evaluateVector3(v3, scope, units);

	return `${a} ${b} ${c}`;
}

function createOriginElement(position: Vector3 | undefined, rotation: Vector3 | undefined, scope: Scope): Generated {

	// No need to add pose string if both position and rotation are undefined
	if (!position && !rotation) return undefined;

	const xyz = position ? ` xyz="${vector3ToString(position, scope, 'm')}"` : "";
	const rpy = rotation ? ` rpy="${vector3ToString(rotation, scope, 'rad')}"` : "";

	return expandToNode`<origin${xyz}${rpy} />`;

}

function limitsToString(revolute: Revolute, scope: Scope): Generated {

	const maxEffort = revolute.maxEffort ? evaluateExpressionAsNumber(revolute.maxEffort, scope, 'N m') : 0;
	const maxVelocity = revolute.maxVelocity ? evaluateExpressionAsNumber(revolute.maxVelocity, scope, 'm/s') : 0;

	const lowerString = revolute.lowerAngleLimit ? `lower="${evaluateExpressionAsNumber(revolute.lowerAngleLimit, scope, 'rad')}" ` : "";
	const upperString = revolute.upperAngleLimit ? `upper="${evaluateExpressionAsNumber(revolute.upperAngleLimit, scope, 'rad')}" ` : "";

	return expandToNode`<limit ${lowerString}${upperString}effort="${maxEffort}" velocity="${maxVelocity}" />`;

}

function checkedAdd(a: number | Unit, b: number | Unit): number | Unit {
	if (typeof a === "number" && typeof b === "number") {
		return a + b;
	} else if (typeOf(a) === "Unit" && typeOf(b) === "Unit" && (a as Unit).equalBase(b as Unit)) {
		return add(a, b);
	} else {
		throw new Error("Invalid types for addition: " + typeOf(a) + " and " + typeOf(b));
	}
}

function checkedSub(a: number | Unit, b: number | Unit): number | Unit {
	if (typeof a === "number" && typeof b === "number") {
		return a - b;
	} else if (typeOf(a) === "Unit" && typeOf(b) === "Unit" && (a as Unit).equalBase(b as Unit)) {
		return subtract(a, b);
	} else {
		throw new Error("Invalid types for subtraction: " + typeOf(a) + " and " + typeOf(b));
	}
}
