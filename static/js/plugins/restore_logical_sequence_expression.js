function restoreLogicalSequenceExpr(ast) {
    const visitor = {
        LogicalExpression(path) {
            function transformANDLogicalExpr(logical_expr) {
                const { left, right, operator } = logical_expr;
                types.assertLogicalExpression(left);
                const { left: left_left, right: left_right, operator: left_operator } = left;
                if (left_operator === '&&') {
                    types.assertLogicalExpression(left_left);
                    const new_logical_expr1 = types.logicalExpression(operator, left_right, right);
                    const new_logical_expr2 = types.logicalExpression(left_operator, left_left, new_logical_expr1);
                    return transformANDLogicalExpr(new_logical_expr2);
                } else {
                    types.assertBinaryExpression(left_left);
                    types.assertSequenceExpression(left_right);
                    return logical_expr;
                }
            }

            function transformORLogicalExpr(logical_expr) {
                const { left, right, operator } = logical_expr;
                types.assertLogicalExpression(left);
                const { left: left_left, right: left_right, operator: left_operator } = left;
                if (left_operator === '||') {
                    types.assertLogicalExpression(left_left);
                    const new_logical_expr1 = types.logicalExpression(operator, left_right, right);
                    const new_logical_expr2 = types.logicalExpression(left_operator, left_left, new_logical_expr1);
                    return transformORLogicalExpr(new_logical_expr2);
                } else {
                    types.assertBinaryExpression(left_left);
                    types.assertSequenceExpression(left_right);
                    return logical_expr;
                }
            }

            const { parentPath } = path;
            const { operator } = path.node;
            if (parentPath.isExpressionStatement()) {
                if (operator === '&&') {
                    path.node = transformANDLogicalExpr(path.node);
                    const { left, right } = path.node;
                    const { left: left_left, right: left_right, } = left;
                    const if_stmt = types.ifStatement(left_left, types.blockStatement([types.expressionStatement(right)]), types.blockStatement(left_right.expressions.slice(0, -1).map(types.expressionStatement)));
                    parentPath.replaceInline(if_stmt);
                } else {
                    path.node = transformORLogicalExpr(path.node);
                    const { left, right } = path.node;
                    const { left: left_left, right: left_right } = left;
                    const if_stmt = types.ifStatement(left_left, types.blockStatement(left_right.expressions.slice(0, -1).map(types.expressionStatement)), types.blockStatement([types.expressionStatement(right)]));
                    parentPath.replaceInline(if_stmt);
                }
            }
        },
        SequenceExpression(path) {
            const { parentPath } = path;
            const { expressions } = path.node;
            if (parentPath.isExpressionStatement()) {
                parentPath.replaceWithMultiple(expressions.map(types.expressionStatement));
            }
        }
    };
    traverse(ast, visitor);
}