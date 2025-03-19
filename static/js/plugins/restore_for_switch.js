function restoreForSwitch(ast) {
    const visitor = {
        ForStatement(path) {
            function wanderControlFlow(control_var_value) {
                const new_body = [];
                while (control_var_value) {
                    const switch_case = switch_cases.find(case_ => case_.test.value === control_var_value);
                    for (const stmt of switch_case.consequent) {
                        if (
                            types.isIfStatement(stmt) &&
                            stmt.consequent.body.length === 1 &&
                            types.isExpressionStatement(stmt.consequent.body[0]) &&
                            types.isAssignmentExpression(stmt.consequent.body[0].expression) &&
                            types.isIdentifier(stmt.consequent.body[0].expression.left, { name: control_var_name }) &&
                            stmt.alternate.body.length === 1 &&
                            types.isExpressionStatement(stmt.alternate.body[0]) &&
                            types.isAssignmentExpression(stmt.alternate.body[0].expression) &&
                            types.isIdentifier(stmt.alternate.body[0].expression.left, { name: control_var_name })
                        ) {
                            const { consequent, alternate, test } = stmt;
                            const new_consequent = types.blockStatement(wanderControlFlow(consequent.body[0].expression.right.value));
                            const new_alternate = types.blockStatement(wanderControlFlow(alternate.body[0].expression.right.value));
                            const new_if_stmt = types.ifStatement(test, new_consequent, new_alternate);
                            new_body.push(new_if_stmt);
                            control_var_value = 0;
                        } else if (
                            types.isExpressionStatement(stmt) &&
                            types.isAssignmentExpression(stmt.expression) &&
                            types.isIdentifier(stmt.expression.left, { name: control_var_name })
                        ) {
                            control_var_value = stmt.expression.right.value;
                        } else if (types.isReturnStatement(stmt)) {
                            new_body.push(stmt);
                            control_var_value = 0;
                        } else if (!types.isBreakStatement(stmt)) {
                            new_body.push(stmt);
                        }
                    }
                }
                return new_body;
            }

            let control_var_name, switch_cases;
            const { body, test, init } = path.node;
            if (body.body.length === 1 && types.isSwitchStatement(body.body[0])) {
                const new_body = [];
                control_var_name = test.name;
                const var_declaration = init;
                const declarators = var_declaration.declarations.filter(declarator => declarator.id.name !== control_var_name);
                if (declarators.length > 0) {
                    const new_var_declaration = types.variableDeclaration(var_declaration.kind, declarators);
                    new_body.push(new_var_declaration);
                }
                const control_var_value = path.scope.getBinding(control_var_name).path.node.init.value;
                switch_cases = body.body[0].cases;
                new_body.push(...wanderControlFlow(control_var_value));
                path.replaceInline(new_body);
            }
        }
    };
    traverse(ast, visitor);
}