function deControlFlowFlatten3(path) {
    const { left, right, operator } = path.node;
    const new_right = types.isIfStatement(right) ? right : types.expressionStatement(right);

    function wanderIf(current_if_statement) {
        const { consequent, alternate } = current_if_statement;
        let hasIfStatement = false;
        for (const statement of consequent.body) {
            if (types.isIfStatement(statement)) {
                hasIfStatement = true;
                wanderIf(statement);
            }
        }
        for (const statement of alternate.body) {
            if (types.isIfStatement(statement)) {
                wanderIf(statement);
            }
        }
        if (!hasIfStatement) {
            consequent.body.push(new_right);
        }
    }

    function wanderElse(current_if_statement) {
        const { consequent, alternate } = current_if_statement;
        let hasIfStatement = false;
        for (const statement of consequent.body) {
            if (types.isIfStatement(statement)) {
                wanderElse(statement);
            }
        }
        for (const statement of alternate.body) {
            if (types.isIfStatement(statement)) {
                hasIfStatement = true;
                wanderElse(statement);
            }
        }
        if (!hasIfStatement) {
            alternate.body.push(new_right);
        }
    }

    const { container, parentPath, key } = path;
    if (types.isIfStatement(left)) {
        if (operator === '&&') {
            wanderIf(left);
        } else {
            wanderElse(left);
        }
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
        if (parentPath.isLogicalExpression()) {
            container[key] = if_statement;
        } else {
            console.log(666);
        }
    }
}