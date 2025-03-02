function deControlFlowFlatten(path) {
    const new_body = [];
    const control_variable = path.node.test.name;
    const variable_declaration = path.node.init;
    const declarators = variable_declaration.declarations.filter(declarator => declarator.id.name !== control_variable);
    if (declarators.length > 0) {
        const new_variable_declaration = types.variableDeclaration(variable_declaration.kind, declarators);
        new_body.push(new_variable_declaration);
    }
    let control_variable_value = path.scope.getBinding(control_variable).path.node.init.value;
    const switch_cases = path.node.body.body[0].cases;

    function wanderControlFlow(control_variable_value) {
        const new_body = [];
        while (control_variable_value) {
            const switch_case = switch_cases.find(case_ => case_.test.value === control_variable_value);
            for (const statement of switch_case.consequent) {
                if (!types.isBreakStatement(statement)) {
                    if (statement.expression?.left?.name === control_variable) {
                        const right = statement.expression.right;
                        if (types.isConditionalExpression(right)) {
                            const consequent = types.blockStatement(wanderControlFlow(right.consequent.value));
                            const alternate = types.blockStatement(wanderControlFlow(right.alternate.value));
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

    new_body.push(...wanderControlFlow(control_variable_value));
    path.replaceInline(new_body);
}