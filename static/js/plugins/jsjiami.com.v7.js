function handleChangeArrayIIFE_v7(ast, return_array_function_name) {
    let code_str;
    const visitor = {
        CallExpression(path) {
            if (
                types.isExpressionStatement(path.node.callee.body?.body?.[0]) &&
                types.isExpressionStatement(path.node.callee.body?.body?.[1]) &&
                types.isExpressionStatement(path.node.callee.body?.body?.[2]) &&
                types.isReturnStatement(path.node.callee.body?.body?.[3]) &&
                path.node.callee.body?.body?.length === 4 &&
                types.isNumericLiteral(path.node.arguments[0]) &&
                types.isNumericLiteral(path.node.arguments[1]) &&
                path.node.arguments[2]?.name === return_array_function_name &&
                types.isNumericLiteral(path.node.arguments[3]) &&
                path.node.arguments.length === 4
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

function handleReturnArrayFunction_v7(ast) {
    let code_str = '';
    const visitor = {
        VariableDeclaration(path) {
            if (path.node.declarations.some(declarator => declarator.init?.value === 'jsjiami.com.v7')) {
                code_str += generate(path.node, {
                    compact: true,
                }).code;
                path.remove();
            }
        }
    };
    traverse(ast, visitor);
    const { return_array_function_name, code_str: code_str1 } = originalHandleReturnArrayFunction(ast);
    code_str += code_str1;
    return { return_array_function_name, code_str };
}