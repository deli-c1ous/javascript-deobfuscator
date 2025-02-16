function deControlFlowFlatten3(path) {
    const { left, right, operator } = path.node;
    const new_right = types.isIfStatement(right) ? right : types.expressionStatement(right);

    function ifStatementWander1(current_if_statement) {
        const { consequent, alternate } = current_if_statement;
        let hasIfStatement = false;
        for (const statement of consequent.body) {
            if (types.isIfStatement(statement)) {
                hasIfStatement = true;
                ifStatementWander1(statement);
            }
        }
        if (!hasIfStatement) {
            consequent.body.push(new_right);
        }
        for (const statement of alternate.body) {
            if (types.isIfStatement(statement)) {
                ifStatementWander1(statement);
            }
        }
    }

    function ifStatementWander2(current_if_statement) {
        const { consequent, alternate } = current_if_statement;
        let hasIfStatement = false;
        for (const statement of consequent.body) {
            if (types.isIfStatement(statement)) {
                ifStatementWander2(statement);
            }
        }
        for (const statement of alternate.body) {
            if (types.isIfStatement(statement)) {
                hasIfStatement = true;
                ifStatementWander2(statement);
            }
        }
        if (!hasIfStatement) {
            alternate.body.push(new_right);
        }
    }

    if (types.isIfStatement(left)) {
        if (operator === '&&') {
            ifStatementWander1(left);
        } else {
            ifStatementWander2(left);
        }
        const { container, parentPath, key } = path;
        if (parentPath.isExpressionStatement()) {
            parentPath.replaceInline(left);
        } else if (parentPath.isLogicalExpression()) {
            container[key] = left;
        } else if (parentPath.isSequenceExpression()) {
            container[key] = left;
        } else {
            console.log(555);
        }
    } else {
        const consequent = types.blockStatement([new_right]);
        const alternate = types.blockStatement([]);
        const if_statement = operator === '&&' ? types.ifStatement(left, consequent, alternate) : types.ifStatement(left, alternate, consequent);
        const { container, parentPath, key } = path;
        if (parentPath.isLogicalExpression()) {
            container[key] = if_statement;
        } else {
            console.log(666);
        }
    }
}