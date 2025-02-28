function deControlFlowFlatten2(path) {
    const new_body = [];
    new_body.push(path.node.init);
    const control_variable = path.node.test.name;
    let control_variable_value = path.node.init.declarations.find(declarator => declarator.id.name === control_variable).init.value;
    const switch_cases = path.node.body.body[0].cases;

    function wanderControlFlow(control_variable_value) {
        const new_body = [];
        while (control_variable_value) {
            const switch_case = switch_cases.find(case_ => case_.test.value === control_variable_value);
            const case_body = switch_case.consequent;
            for (const statement of case_body) {
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