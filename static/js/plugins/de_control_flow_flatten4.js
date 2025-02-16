function deControlFlowFlatten4(path) {
    const new_body = [];
    const for_statement = path.node;
    const for_init = for_statement.init;
    new_body.push(for_init);
    const control_variable = for_statement.test.name;
    const control_variable_declaration = for_init.declarations.find(declaration => declaration.id.name === control_variable);
    eval(generate(control_variable_declaration).code);
    const for_body = for_statement.body;

    function recoverControlVariable(value) {
        const code_str = `${control_variable} = ${value};`;
        eval(code_str);
    }

    function ifStatementWander(current_if_statement) {
        const new_body = [];
        let isFinished = false;
        const test = current_if_statement.test;
        const test_result = eval(generate(test).code);
        const next = test_result ? current_if_statement.consequent : current_if_statement.alternate;
        if (types.isBlockStatement(next)) {
            for (const statement of next.body) {
                if (types.isIfStatement(statement)) {
                    const { isFinished: inner_isFinished, new_body: inner_new_body } = ifStatementWander(statement);
                    new_body.push(...inner_new_body);
                    isFinished = inner_isFinished;
                } else if (
                    types.isExpressionStatement(statement) &&
                    types.isAssignmentExpression(statement.expression) &&
                    statement.expression.left.name === control_variable
                ) {
                    const assignment_expression = statement.expression;
                    const right = assignment_expression.right;
                    if (types.isConditionalExpression(right)) {
                        const now_control_variable_value = eval(control_variable);
                        const new_assignment_expression = types.assignmentExpression(assignment_expression.operator, assignment_expression.left, right.consequent);
                        eval(generate(new_assignment_expression).code);
                        const consequent = types.blockStatement(controlFlowWander());
                        recoverControlVariable(now_control_variable_value);
                        new_assignment_expression.right = right.alternate;
                        eval(generate(new_assignment_expression).code);
                        const alternate = types.blockStatement(controlFlowWander());
                        const new_if_statement = types.ifStatement(right.test, consequent, alternate);
                        new_body.push(new_if_statement);
                        isFinished = true;
                    } else {
                        eval(generate(assignment_expression).code);
                    }
                } else if (types.isExpressionStatement(statement) &&
                    types.isUpdateExpression(statement.expression) && statement.expression.argument.name === control_variable) {
                    eval(generate(statement).code);
                } else {
                    new_body.push(statement);
                    if (types.isReturnStatement(statement)) {
                        isFinished = true;
                    }
                }
            }
        } else if (types.isIfStatement(next)) {
            const { isFinished: inner_isFinished, new_body: inner_new_body } = ifStatementWander(next);
            new_body.push(...inner_new_body);
            isFinished = inner_isFinished;
        } else {
            console.log(777);
        }
        return { isFinished, new_body };
    }

    function controlFlowWander() {
        const new_body = [];
        while (eval(control_variable)) {
            const { isFinished, new_body: inner_new_body } = ifStatementWander(for_body.body[0]);
            new_body.push(...inner_new_body);
            if (isFinished) {
                break;
            }
        }
        return new_body;
    }

    new_body.push(...controlFlowWander());
    path.replaceInline(new_body);
}