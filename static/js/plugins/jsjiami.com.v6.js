function handleArrayDeclaration_v6(ast) {
    let array_name, code_str;
    const visitor = {
        VariableDeclaration(path) {
            if (path.node.declarations.some(declarator => declarator.init?.elements?.[0]?.value === 'jsjiami.com.v6')) {
                array_name = path.node.declarations.find(declarator => declarator.init?.elements?.[0]?.value === 'jsjiami.com.v6').id.name;
                code_str = generate(path.node, {
                    compact: true,
                }).code;
                path.remove();
            } else if (path.node.declarations.some(declarator => declarator.init?.value === 'jsjiami.com.v6')) {
                const indentifier_name = path.node.declarations.find(declarator => declarator.init?.value === 'jsjiami.com.v6').id.name;
                path.scope.getBinding(indentifier_name).constantViolations.forEach(path => {
                    path.getStatementParent().remove();
                });
                array_name = path.node.declarations.find(declarator => declarator.init?.elements?.[0]?.name === indentifier_name).id.name;
                code_str = generate(path.node, {
                    compact: true,
                }).code;
                path.remove();
            }
        }
    };
    traverse(ast, visitor);
    return { array_name, code_str };
}

function handleDecryptStringFunctions_v6(ast, array_name) {
    let decrypt_string_function_names = [], code_str = '';
    const visitor = {
        FunctionDeclaration(path) {
            if (
                types.isExpressionStatement(path.node.body.body[0]) &&
                types.isVariableDeclaration(path.node.body.body[1]) &&
                types.isIfStatement(path.node.body.body[2]) &&
                types.isVariableDeclaration(path.node.body.body[3]) &&
                types.isIfStatement(path.node.body.body[4]) &&
                types.isReturnStatement(path.node.body.body[5]) &&
                path.node.body.body.length === 6 &&
                path.node.body.body[1]?.declarations?.[0]?.init?.object?.name === array_name
            ) {
                decrypt_string_function_names.push(path.node.id.name);
                code_str += generate(path.node, {
                    compact: true,
                }).code;
                path.remove();
            }
        }
    };
    traverse(ast, visitor);
    return { decrypt_string_function_names, code_str };
}

function handleChangeArrayIIFE_v6(ast, array_name) {
    let code_str;
    const visitor = {
        CallExpression(path) {
            if (
                path.node.arguments[0]?.name === array_name &&
                types.isNumericLiteral(path.node.arguments[1]) &&
                types.isNumericLiteral(path.node.arguments[2]) &&
                path.node.arguments.length === 3
            ) {
                const parent_path = path.getStatementParent();
                code_str = generate(parent_path.node, {
                    compact: true,
                }).code;
                parent_path.remove();
            }
        }
    };
    traverse(ast, visitor);
    return code_str;
}