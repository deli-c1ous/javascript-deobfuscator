function restoreLogicalSequenceExpression(ast) {
    const visitor = {
        LogicalExpression(path) {
            const { parentPath } = path;
            const { left, right, operator } = path.node;
            if (parentPath.isExpressionStatement()) {
                if (operator === '&&') {
                    let prev_right = right, prev_left = left, prev_operator = operator;
                    while (prev_operator === '&&') {
                        types.assertLogicalExpression(prev_left);
                        const { left: now_left, right: now_right, operator: now_operator } = prev_left;
                        if (now_operator === '||') {
                            path.replaceInline(types.logicalExpression(prev_operator, prev_left, prev_right));
                        } else {
                            prev_right = types.logicalExpression(prev_operator, now_right, prev_right);
                            prev_left = now_left;
                        }
                        prev_operator = now_operator;
                    }
                    const { left: new_left, right: new_right } = path.node;
                    const { left: new_left_left, right: new_left_right } = new_left;
                    const if_stmt = types.ifStatement(new_left_left, types.blockStatement([types.expressionStatement(new_right)]), types.blockStatement([types.expressionStatement(new_left_right)]));
                    parentPath.replaceInline(if_stmt);
                } else {
                    let prev_right = right, prev_left = left, prev_operator = operator;
                    while (prev_operator === '||') {
                        types.assertLogicalExpression(prev_left);
                        const { left: now_left, right: now_right, operator: now_operator } = prev_left;
                        if (now_operator === '&&') {
                            path.replaceInline(types.logicalExpression(prev_operator, prev_left, prev_right));
                        } else {
                            prev_right = types.logicalExpression(prev_operator, now_right, prev_right);
                            prev_left = now_left;
                        }
                        prev_operator = now_operator;
                    }
                    const { left: new_left, right: new_right } = path.node;
                    const { left: new_left_left, right: new_left_right } = new_left;
                    const if_stmt = types.ifStatement(new_left_left, types.blockStatement([types.expressionStatement(new_left_right)]), types.blockStatement([types.expressionStatement(new_right)]));
                    parentPath.replaceInline(if_stmt);
                }
            }
        },
        SequenceExpression(path) {
            const { expressions } = path.node;
            const { parentPath } = path;
            if (parentPath.isExpressionStatement()) {
                parentPath.replaceWithMultiple(expressions.map(types.expressionStatement));
            }
        }
    };
    traverse(ast, visitor);
}