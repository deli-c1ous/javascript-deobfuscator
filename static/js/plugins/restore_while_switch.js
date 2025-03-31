function restoreWhileSwitch(ast) {
    const visitor = {
        WhileStatement(path) {
            const { test, body } = path.node;
            if (
                types.isBooleanLiteral(test, { value: true }) &&
                body.body.length === 2 &&
                types.isSwitchStatement(body.body[0]) &&
                types.isMemberExpression(body.body[0].discriminant) &&
                types.isIdentifier(body.body[0].discriminant.object) &&
                types.isUpdateExpression(body.body[0].discriminant.property) &&
                types.isIdentifier(body.body[0].discriminant.property.argument) &&
                types.isBreakStatement(body.body[1])
            ) {
                const switch_stmt = body.body[0];
                const switch_cases = switch_stmt.cases;
                const control_flow_index_array_name = switch_stmt.discriminant.object.name;
                const control_flow_index_array_binding = path.scope.getBinding(control_flow_index_array_name);
                const control_flow_index_array = eval(control_flow_index_array_binding.path.get('init').toString());
                const control_flow_var_name = switch_stmt.discriminant.property.argument.name;
                const control_flow_var_binding = path.scope.getBinding(control_flow_var_name);
                control_flow_index_array_binding.path.remove();
                control_flow_var_binding.path.remove();

                const new_body = [];
                control_flow_index_array.forEach(index => {
                    const switch_case = switch_cases.find(case_ => case_.test.value === index);
                    const case_body = switch_case.consequent.filter(stmt => !types.isContinueStatement(stmt));
                    new_body.push(...case_body);
                });
                path.replaceInline(new_body);
            }
        }
    };
    traverse(ast, visitor);
}