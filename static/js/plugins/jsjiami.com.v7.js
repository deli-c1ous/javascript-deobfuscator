function handleChangeArrayIIFE_v7(ast, return_array_function_name) {
    let code_str;
    const visitor = {
        ExpressionStatement(path) {
            if (
                types.isExpressionStatement(path.node.expression.left?.expressions?.[0]?.callee?.body?.body?.[0]) &&
                types.isExpressionStatement(path.node.expression.left?.expressions?.[0]?.callee?.body?.body?.[1]) &&
                types.isExpressionStatement(path.node.expression.left?.expressions?.[0]?.callee?.body?.body?.[2]) &&
                types.isReturnStatement(path.node.expression.left?.expressions?.[0]?.callee?.body?.body?.[3]) &&
                path.node.expression.left?.expressions?.[0]?.callee?.body?.body?.length === 4 &&
                types.isNumericLiteral(path.node.expression.left?.expressions?.[0]?.arguments?.[0]) &&
                types.isNumericLiteral(path.node.expression.left?.expressions?.[0]?.arguments?.[1]) &&
                path.node.expression.left?.expressions?.[0]?.arguments?.[2]?.name === return_array_function_name &&
                types.isNumericLiteral(path.node.expression.left?.expressions?.[0]?.arguments?.[3]) &&
                path.node.expression.left?.expressions?.[0]?.arguments?.length === 4
            ) {
                code_str = generate(path.node, {
                    compact: true,
                }).code;
                path.remove();
            }
        }
    }
    traverse(ast, visitor);
    return code_str;
}

function handleReturnArrayFunction_v7(ast) {
    let code_str1 = '';
    const visitor = {
        VariableDeclaration(path) {
            if (path.node.declarations[0].init?.value === 'jsjiami.com.v7') {
                code_str1 += generate(path.node, {
                    compact: true,
                }).code;
                path.remove();
            }
        }
    }
    traverse(ast, visitor);

    const [return_array_function_name, code_str2] = handleReturnArrayFunction(ast);
    return [return_array_function_name, code_str1 + code_str2];
}