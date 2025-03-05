function deControlFlowFlatten4(path) {
    const new_body = [];
    const control_variable = path.node.test.name;
    const variable_declaration = path.node.init;
    const declarators = variable_declaration.declarations.filter(declarator => declarator.id.name !== control_variable);
    if (declarators.length > 0) {
        const new_variable_declaration = types.variableDeclaration(variable_declaration.kind, declarators);
        new_body.push(new_variable_declaration);
    }
    const control_variable_declaration_code_str = path.scope.getBinding(control_variable).path.toString();
    eval(control_variable_declaration_code_str);

    function wanderIfStatement(current_if_statement) {
        const new_body = [];
        const test_result = eval(generate(current_if_statement.test).code);
        const next = test_result ? current_if_statement.consequent : current_if_statement.alternate;
        if (types.isBlockStatement(next)) {
            for (const statement of next.body) {
                if (types.isIfStatement(statement)) {
                    const inner_new_body = wanderIfStatement(statement);
                    new_body.push(...inner_new_body);
                } else if (statement.expression?.left?.name === control_variable) {
                    const assignment_expression = statement.expression;
                    const right = assignment_expression.right;
                    if (types.isConditionalExpression(right)) {
                        const current_control_variable_value = eval(control_variable);
                        const new_assignment_expression = types.assignmentExpression(assignment_expression.operator, assignment_expression.left, right.consequent);
                        eval(generate(new_assignment_expression).code);
                        const consequent = types.blockStatement(wanderControlFlow());
                        eval(`${control_variable} = ${current_control_variable_value}`);
                        new_assignment_expression.right = right.alternate;
                        eval(generate(new_assignment_expression).code);
                        const alternate = types.blockStatement(wanderControlFlow());
                        const new_if_statement = types.ifStatement(right.test, consequent, alternate);
                        new_body.push(new_if_statement);
                    } else {
                        eval(generate(statement).code);
                    }
                } else if (statement.expression?.argument?.name === control_variable) {
                    eval(generate(statement).code);
                } else {
                    new_body.push(statement);
                    if (types.isReturnStatement(statement)) {
                        eval(`${control_variable} = 0`);
                    }
                }
            }
        } else {
            console.log(333);
        }
        return new_body;
    }

    function wanderControlFlow() {
        const new_body = [];
        while (eval(control_variable)) {
            const inner_new_body = wanderIfStatement(path.node.body.body[0]);
            new_body.push(...inner_new_body);
        }
        return new_body;
    }

    new_body.push(...wanderControlFlow());
    path.replaceInline(new_body);
}