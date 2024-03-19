import type { ValidationAcceptor, ValidationChecks } from "langium";
import type { SsdlAstType, Robot, MacroDef } from "./generated/ast.js";
import type { SsdlServices } from "./ssdl-module.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: SsdlServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.SsdlValidator;
  const checks: ValidationChecks<SsdlAstType> = {
    // Person: validator.checkPersonStartsWithCapital,
    Robot: validator.checkUniqueDefinitions,
    MacroDef: validator.checkUniqueParameters,
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class SsdlValidator {
  checkUniqueDefinitions(robot: Robot, accept: ValidationAcceptor): void {
    const parsedDefinitions = new Set();
    robot.definitions.forEach((definition) => {
      if (parsedDefinitions.has(definition.name)) {
        accept("error", `Duplicate definition name '${definition.name}'`, {
          node: definition,
          property: "name",
        });
      }
      parsedDefinitions.add(definition.name);
    });
  }
  checkUniqueParameters(macroDef: MacroDef, accept: ValidationAcceptor): void {
    const parsedParameters = new Set();
    macroDef.parameters.forEach((parameter) => {
      if (parsedParameters.has(parameter.name)) {
        accept("error", `Duplicate parameter name '${parameter.name}'`, {
          node: parameter,
          property: "name",
        });
      }
      parsedParameters.add(parameter.name);
    });
  }
}
