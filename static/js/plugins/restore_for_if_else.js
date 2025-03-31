function restoreForIfElse(ast) {
    const visitor = {
        ForStatement(path) {
            function wanderControlFlow() {
                const new_body = [];
                while (eval(control_var_name)) {
                    new_body.push(...wanderIfStmt(body.body[0]));
                }
                return new_body;
            }

            function wanderIfStmt(current_if_stmt) {
                const new_body = [];
                const { consequent, alternate, test } = current_if_stmt;
                const test_result = eval(generate(test).code);
                const next = test_result ? consequent : alternate;
                types.assertBlockStatement(next);
                for (const stmt of next.body) {
                    if (types.isIfStatement(stmt)) {
                        const { consequent, alternate, test } = stmt;
                        if (
                            consequent.body.length === 1 &&
                            types.isExpressionStatement(consequent.body[0]) &&
                            types.isAssignmentExpression(consequent.body[0].expression) &&
                            types.isIdentifier(consequent.body[0].expression.left, { name: control_var_name }) &&
                            alternate.body.length === 1 &&
                            types.isExpressionStatement(alternate.body[0]) &&
                            types.isAssignmentExpression(alternate.body[0].expression) &&
                            types.isIdentifier(alternate.body[0].expression.left, { name: control_var_name })
                        ) {
                            const current_control_var_value = eval(control_var_name);
                            const consequent_assignment_stmt = consequent.body[0];
                            eval(generate(consequent_assignment_stmt).code);
                            const new_consequent = types.blockStatement(wanderControlFlow());
                            eval(`${control_var_name} = ${current_control_var_value}`);
                            const alternate_assignment_stmt = alternate.body[0];
                            eval(generate(alternate_assignment_stmt).code);
                            const new_alternate = types.blockStatement(wanderControlFlow());
                            const if_stmt = types.ifStatement(test, new_consequent, new_alternate);
                            new_body.push(if_stmt);
                        } else {
                            new_body.push(...wanderIfStmt(stmt));
                        }
                    } else if (
                        types.isExpressionStatement(stmt) &&
                        types.isAssignmentExpression(stmt.expression) &&
                        types.isIdentifier(stmt.expression.left, { name: control_var_name })
                    ) {
                        eval(generate(stmt).code);
                    } else if (
                        types.isExpressionStatement(stmt) &&
                        types.isUpdateExpression(stmt.expression) &&
                        types.isIdentifier(stmt.expression.argument, { name: control_var_name })
                    ) {
                        eval(generate(stmt).code);
                    } else if (types.isReturnStatement(stmt)) {
                        new_body.push(stmt);
                        eval(`${control_var_name} = 0`);
                    } else {
                        new_body.push(stmt);
                    }
                }
                return new_body;
            }

            let control_var_name;
            const { body } = path.node;
            if (body.body.length === 1 && types.isIfStatement(body.body[0])) {
                const new_body = [];
                const { test, init } = path.node;
                control_var_name = test.name;
                if (init.declarations[0].id.name !== control_var_name) {
                    new_body.push(init);
                }
                const binding = path.scope.getBinding(control_var_name);
                const control_var_declaration_code = binding.path.toString();
                eval(control_var_declaration_code);
                binding.path.remove();
                new_body.push(...wanderControlFlow());
                path.replaceInline(new_body);
            }
        }
    };
    traverse(ast, visitor);
}