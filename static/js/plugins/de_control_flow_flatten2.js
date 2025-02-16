function deControlFlowFlatten2(path) {
    const new_body = [];
    const for_statement = path.node;
    const for_init = for_statement.init;
    new_body.push(for_init);
    const control_variable = for_statement.test.name;
    let control_variable_value;
    for (const declaration of for_init.declarations) {
        if (declaration.id.name === control_variable) {
            control_variable_value = declaration.init.value;
            break;
        }
    }
    const switch_cases = for_statement.body.body[0].cases;

    function controlFlowWander(control_variable_value) {
        const new_body = [];
        while (control_variable_value) {
            const switch_case = switch_cases.find(case_ => case_.test.value === control_variable_value);
            const case_body = switch_case.consequent;
            for (const statement of case_body) {
                if (!types.isBreakStatement(statement)) {
                    if (
                        types.isExpressionStatement(statement) &&
                        types.isAssignmentExpression(statement.expression) &&
                        statement.expression.left.name === control_variable
                    ) {
                        const right = statement.expression.right;
                        if (types.isConditionalExpression(right)) {
                            const consequent = types.blockStatement(controlFlowWander(right.consequent.value));
                            const alternate = types.blockStatement(controlFlowWander(right.alternate.value));
                            const new_if_statement = types.ifStatement(right.test, consequent, alternate);
                            new_body.push(new_if_statement);
                            return new_body;
                        } else {
                            control_variable_value = right.value;
                        }
                    } else {
                        new_body.push(statement);
                        if (types.isReturnStatement(statement)) {
                            return new_body;
                        }
                    }
                }
            }
        }
        return new_body;
    }

    new_body.push(...controlFlowWander(control_variable_value));
    path.replaceInline(new_body);
}