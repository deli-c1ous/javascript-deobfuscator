function findReturnStringArrayFunc(ast) {
    let return_string_array_func_name;

    const visitor = {
        FunctionDeclaration(path) {
            const { body, params, id } = path.node;
            if (
                params.length === 0 &&
                body.body.length === 3 &&

                types.isVariableDeclaration(body.body[0]) &&
                body.body[0].declarations.length === 1 &&

                types.isExpressionStatement(body.body[1]) &&
                types.isAssignmentExpression(body.body[1].expression) &&
                types.isIdentifier(body.body[1].expression.left, { name: id.name }) &&
                types.isFunctionExpression(body.body[1].expression.right) &&
                body.body[1].expression.right.params.length === 0 &&
                body.body[1].expression.right.body.body.length === 1 &&
                types.isReturnStatement(body.body[1].expression.right.body.body[0]) &&
                types.isIdentifier(body.body[1].expression.right.body.body[0].argument, { name: body.body[0].declarations[0].id.name }) &&

                types.isReturnStatement(body.body[2]) &&
                types.isCallExpression(body.body[2].argument) &&
                types.isIdentifier(body.body[2].argument.callee, { name: id.name })
            ) {
                return_string_array_func_name = id.name;
                const code = generate(path.node, { compact: true }).code;
                (0, eval)(code);
                path.remove();
            }
        },
    }
    traverse(ast, visitor);

    return { return_string_array_func_name };
}

function findDecryptStringFunc(ast, return_string_array_func_name) {
    let decrypt_string_func_names = [];

    const visitor = {
        FunctionDeclaration(path) {
            const { body, params, id } = path.node;
            if (
                params.length === 2 &&
                body.body.length === 3 &&

                types.isVariableDeclaration(body.body[0]) &&
                body.body[0].declarations.length === 1 &&
                types.isCallExpression(body.body[0].declarations[0].init) &&
                types.isIdentifier(body.body[0].declarations[0].init.callee, { name: return_string_array_func_name }) &&

                types.isExpressionStatement(body.body[1]) &&
                types.isAssignmentExpression(body.body[1].expression) &&
                types.isIdentifier(body.body[1].expression.left, { name: id.name }) &&
                types.isFunctionExpression(body.body[1].expression.right) &&
                body.body[1].expression.right.params.length === 2 &&
                body.body[1].expression.right.body.body.length >= 3 &&
                types.isExpressionStatement(body.body[1].expression.right.body.body[0]) &&
                types.isAssignmentExpression(body.body[1].expression.right.body.body[0].expression) &&
                types.isIdentifier(body.body[1].expression.right.body.body[0].expression.left, { name: body.body[1].expression.right.params[0].name }) &&
                types.isBinaryExpression(body.body[1].expression.right.body.body[0].expression.right) &&
                types.isIdentifier(body.body[1].expression.right.body.body[0].expression.right.left, { name: body.body[1].expression.right.params[0].name }) &&
                types.isNumericLiteral(body.body[1].expression.right.body.body[0].expression.right.right) &&
                types.isVariableDeclaration(body.body[1].expression.right.body.body[1]) &&
                body.body[1].expression.right.body.body[1].declarations.length === 1 &&
                types.isMemberExpression(body.body[1].expression.right.body.body[1].declarations[0].init) &&
                types.isIdentifier(body.body[1].expression.right.body.body[1].declarations[0].init.object, { name: body.body[0].declarations[0].id.name }) &&
                types.isIdentifier(body.body[1].expression.right.body.body[1].declarations[0].init.property, { name: body.body[1].expression.right.params[0].name }) &&
                types.isReturnStatement(body.body[1].expression.right.body.body[body.body[1].expression.right.body.body.length - 1]) &&
                types.isIdentifier(body.body[1].expression.right.body.body[body.body[1].expression.right.body.body.length - 1].argument, { name: body.body[1].expression.right.body.body[1].declarations[0].id.name }) &&

                types.isReturnStatement(body.body[2]) &&
                types.isCallExpression(body.body[2].argument) &&
                types.isIdentifier(body.body[2].argument.callee, { name: id.name }) &&
                types.isIdentifier(body.body[2].argument.arguments[0], { name: params[0].name }) &&
                types.isIdentifier(body.body[2].argument.arguments[1], { name: params[1].name })
            ) {
                decrypt_string_func_names.push(id.name);
                const code = generate(path.node, { compact: true }).code;
                (0, eval)(code);
                path.remove();
            }
        },
    }
    traverse(ast, visitor);

    return { decrypt_string_func_names };
}

function findDecryptStringFuncProxy(ast, decrypt_string_func_names) {
    function isDecryptStringFunctionProxyFunc(path) {
        const proxied_func_name = path.node.body.body[0].argument.callee.name;
        if (decrypt_string_func_names.includes(proxied_func_name)) {
            return true;
        } else {
            const proxied_function_path = path.scope.getBinding(proxied_func_name).path;
            const { body } = proxied_function_path.node;
            if (
                body.body.length === 1 &&

                types.isReturnStatement(body.body[0]) &&
                types.isCallExpression(body.body[0].argument) &&
                types.isIdentifier(body.body[0].argument.callee)
            ) {
                return isDecryptStringFunctionProxyFunc(proxied_function_path);
            } else {
                return false;
            }
        }
    }

    function isDecryptStringFunctionProxyVar(path) {
        const proxied_var_name = path.node.init.name;
        if (decrypt_string_func_names.includes(proxied_var_name)) {
            return true;
        } else {
            const proxied_var_path = path.scope.getBinding(proxied_var_name).path;
            const { init } = proxied_var_path.node;
            if (types.isIdentifier(init)) {
                return isDecryptStringFunctionProxyVar(proxied_var_path);
            } else {
                return false;
            }
        }
    }

    let decrypt_string_func_proxy_names = [], decrypt_string_func_proxy_paths = [];

    const visitor = {
        FunctionDeclaration(path) {
            const { id, body } = path.node;
            if (
                body.body.length === 1 &&

                types.isReturnStatement(body.body[0]) &&
                types.isCallExpression(body.body[0].argument) &&
                types.isIdentifier(body.body[0].argument.callee)
            ) {
                if (isDecryptStringFunctionProxyFunc(path)) {
                    decrypt_string_func_proxy_names.push(id.name);
                    decrypt_string_func_proxy_paths.push(path);
                    const code = generate(path.node, { compact: true }).code;
                    (0, eval)(code);
                }
            }
        },
        VariableDeclarator(path) {
            const { id, init } = path.node;
            if (types.isIdentifier(init)) {
                if (isDecryptStringFunctionProxyVar(path)) {
                    decrypt_string_func_proxy_names.push(id.name);
                    decrypt_string_func_proxy_paths.push(path);
                    const code = generate(path.node, { compact: true }).code;
                    (0, eval)(code);
                }
            }
        }
    };
    traverse(ast, visitor);

    decrypt_string_func_proxy_paths.forEach(path => path.remove());

    return { decrypt_string_func_proxy_names };
}

function findChangeStringArrayIIFE(ast, return_string_array_func_name) {
    const visitor = {
        ExpressionStatement(path) {
            const { expression } = path.node;
            if (
                types.isCallExpression(expression) &&
                expression.arguments.length === 2 &&
                types.isIdentifier(expression.arguments[0], { name: return_string_array_func_name }) &&
                types.isNumericLiteral(expression.arguments[1]) &&
                types.isFunctionExpression(expression.callee) &&
                expression.callee.body.body.length === 2 &&
                types.isVariableDeclaration(expression.callee.body.body[0]) &&
                expression.callee.body.body[0].declarations.length === 1 &&
                types.isCallExpression(expression.callee.body.body[0].declarations[0].init) &&
                types.isIdentifier(expression.callee.body.body[0].declarations[0].init.callee, { name: expression.callee.params[0].name }) &&
                types.isWhileStatement(expression.callee.body.body[1]) &&
                types.isBooleanLiteral(expression.callee.body.body[1].test, { value: true }) &&
                expression.callee.body.body[1].body.body.length === 1 &&
                types.isTryStatement(expression.callee.body.body[1].body.body[0]) &&
                expression.callee.body.body[1].body.body[0].block.body.length === 2 &&
                types.isVariableDeclaration(expression.callee.body.body[1].body.body[0].block.body[0]) &&
                expression.callee.body.body[1].body.body[0].block.body[0].declarations.length === 1 &&
                types.isBinaryExpression(expression.callee.body.body[1].body.body[0].block.body[0].declarations[0].init) &&
                types.isIfStatement(expression.callee.body.body[1].body.body[0].block.body[1]) &&
                types.isBinaryExpression(expression.callee.body.body[1].body.body[0].block.body[1].test) &&
                types.isIdentifier(expression.callee.body.body[1].body.body[0].block.body[1].test.left, { name: expression.callee.body.body[1].body.body[0].block.body[0].declarations[0].id.name }) &&
                types.isIdentifier(expression.callee.body.body[1].body.body[0].block.body[1].test.right, { name: expression.callee.params[1].name }) &&
                expression.callee.body.body[1].body.body[0].block.body[1].consequent.body.length === 1 &&
                types.isBreakStatement(expression.callee.body.body[1].body.body[0].block.body[1].consequent.body[0]) &&
                expression.callee.body.body[1].body.body[0].block.body[1].alternate.body.length === 1 &&
                types.isExpressionStatement(expression.callee.body.body[1].body.body[0].block.body[1].alternate.body[0]) &&
                types.isCallExpression(expression.callee.body.body[1].body.body[0].block.body[1].alternate.body[0].expression) &&
                types.isMemberExpression(expression.callee.body.body[1].body.body[0].block.body[1].alternate.body[0].expression.callee) &&
                types.isIdentifier(expression.callee.body.body[1].body.body[0].block.body[1].alternate.body[0].expression.callee.object, { name: expression.callee.body.body[0].declarations[0].id.name }) &&
                types.isIdentifier(expression.callee.body.body[1].body.body[0].block.body[1].alternate.body[0].expression.callee.property, { name: 'push' }) &&
                expression.callee.body.body[1].body.body[0].block.body[1].alternate.body[0].expression.arguments.length === 1 &&
                types.isCallExpression(expression.callee.body.body[1].body.body[0].block.body[1].alternate.body[0].expression.arguments[0]) &&
                types.isMemberExpression(expression.callee.body.body[1].body.body[0].block.body[1].alternate.body[0].expression.arguments[0].callee) &&
                types.isIdentifier(expression.callee.body.body[1].body.body[0].block.body[1].alternate.body[0].expression.arguments[0].callee.object, { name: expression.callee.body.body[0].declarations[0].id.name }) &&
                types.isIdentifier(expression.callee.body.body[1].body.body[0].block.body[1].alternate.body[0].expression.arguments[0].callee.property, { name: 'shift' }) &&
                expression.callee.body.body[1].body.body[0].handler.param &&
                expression.callee.body.body[1].body.body[0].handler.body.body.length === 1 &&
                types.isExpressionStatement(expression.callee.body.body[1].body.body[0].handler.body.body[0]) &&
                types.isCallExpression(expression.callee.body.body[1].body.body[0].handler.body.body[0].expression) &&
                types.isMemberExpression(expression.callee.body.body[1].body.body[0].handler.body.body[0].expression.callee) &&
                types.isIdentifier(expression.callee.body.body[1].body.body[0].handler.body.body[0].expression.callee.object, { name: expression.callee.body.body[0].declarations[0].id.name }) &&
                types.isIdentifier(expression.callee.body.body[1].body.body[0].handler.body.body[0].expression.callee.property, { name: 'push' }) &&
                expression.callee.body.body[1].body.body[0].handler.body.body[0].expression.arguments.length === 1 &&
                types.isCallExpression(expression.callee.body.body[1].body.body[0].handler.body.body[0].expression.arguments[0]) &&
                types.isMemberExpression(expression.callee.body.body[1].body.body[0].handler.body.body[0].expression.arguments[0].callee) &&
                types.isIdentifier(expression.callee.body.body[1].body.body[0].handler.body.body[0].expression.arguments[0].callee.object, { name: expression.callee.body.body[0].declarations[0].id.name }) &&
                types.isIdentifier(expression.callee.body.body[1].body.body[0].handler.body.body[0].expression.arguments[0].callee.property, { name: 'shift' })
            ) {
                const code = generate(path.node, { compact: true }).code;
                (0, eval)(code);
                path.remove();
            }
        }
    }
    traverse(ast, visitor);
}

function restoreCallExpression(ast, decrypt_string_func_aliases) {
    const visitor = {
        CallExpression(path) {
            const { callee } = path.node;
            if (decrypt_string_func_aliases.includes(callee.name)) {
                const value = eval(path.toString());
                const node = types.valueToNode(value);
                path.replaceInline(node);
            }
        }
    };
    traverse(ast, visitor);
}

function findDispatcherObject(ast) {
    let dispatcher_object_names = [], dispatcher_object_paths = [];

    const visitor = {
        VariableDeclarator(path) {
            const { id, init } = path.node;
            if (
                types.isObjectExpression(init) &&
                init.properties.length > 0 &&
                init.properties.every(types.isObjectProperty) &&
                init.properties.every(prop => types.isStringLiteral(prop.key)) &&
                init.properties.every(prop => /^[a-z]{5}$/i.test(prop.key.value))
            ) {
                try {
                    const code = generate(path.node, { compact: true }).code;
                    (0, eval)(code);
                    dispatcher_object_names.push(id.name);
                    dispatcher_object_paths.push(path);
                } catch {
                }
            }
        }
    };
    traverse(ast, visitor);

    return { dispatcher_object_names, dispatcher_object_paths };
}

function restoreMemberExpression(ast, dispatcher_object_names, dispatcher_object_paths) {
    const visitor = {
        MemberExpression(path) {
            const { object, property } = path.node;
            if (
                dispatcher_object_names.includes(object.name) &&
                types.isIdentifier(property) &&
                /^[a-z]{5}$/i.test(property.name)
            ) {
                const value = eval(path.toString());
                const node = types.valueToNode(value);
                path.replaceInline(node);
            }
        },
        CallExpression(path) {
            const { callee, arguments } = path.node;
            if (
                types.isMemberExpression(callee) &&
                dispatcher_object_names.includes(callee.object.name) &&
                types.isIdentifier(callee.property) &&
                /^[a-z]{5}$/i.test(callee.property.name)
            ) {
                const object_name = callee.object.name;
                const property_name = callee.property.name;
                const dispatcher_object_path = dispatcher_object_paths.find(path => path.node.id.name === object_name);
                const properties = dispatcher_object_path.node.init.properties;
                const property = properties.find(prop => prop.key.value === property_name);
                console.assert(property.value.body.body.length === 1);
                types.assertReturnStatement(property.value.body.body[0]);
                const expr = property.value.body.body[0].argument;
                let new_expr;
                if (expr.type === 'BinaryExpression') {
                    new_expr = types.binaryExpression(expr.operator, arguments[0], arguments[1]);
                } else if (expr.type === 'CallExpression') {
                    new_expr = types.callExpression(arguments[0], arguments.slice(1));
                } else if (expr.type === 'LogicalExpression') {
                    new_expr = types.logicalExpression(expr.operator, arguments[0], arguments[1]);
                } else {
                    console.error(`Unsupported expression type: ${expr.type}`);
                }
                path.replaceInline(new_expr);
            }
        }
    };
    traverse(ast, visitor);

    dispatcher_object_paths.forEach(path => path.remove());
}

function removeSelfDefending(ast) {
    const names_to_remove = [];

    const visitor = {
        VariableDeclarator(path) {
            const { id, init } = path.node;
            if (
                types.isCallExpression(init) &&
                types.isFunctionExpression(init.callee) &&
                init.callee.body.body.length === 2 &&
                types.isVariableDeclaration(init.callee.body.body[0]) &&
                init.callee.body.body[0].declarations.length === 1 &&
                types.isBooleanLiteral(init.callee.body.body[0].declarations[0].init, { value: true }) &&
                types.isReturnStatement(init.callee.body.body[1]) &&
                types.isFunctionExpression(init.callee.body.body[1].argument)
                ||
                types.isCallExpression(init) &&
                names_to_remove.includes(init.callee.name) &&
                init.arguments.length === 2 &&
                types.isThisExpression(init.arguments[0]) &&
                types.isFunctionExpression(init.arguments[1])
            ) {
                names_to_remove.push(id.name);
                path.remove();
            }
        },
        CallExpression(path) {
            const { callee } = path.node;
            if (
                types.isIdentifier(callee) &&
                names_to_remove.includes(callee.name)
                ||
                types.isFunctionExpression(callee) &&
                callee.params.length === 0 &&
                callee.body.body.length === 1 &&
                types.isExpressionStatement(callee.body.body[0]) &&
                types.isCallExpression(callee.body.body[0].expression) &&
                types.isCallExpression(callee.body.body[0].expression.callee) &&
                types.isIdentifier(callee.body.body[0].expression.callee.callee) &&
                names_to_remove.includes(callee.body.body[0].expression.callee.callee.name) &&
                callee.body.body[0].expression.callee.arguments.length === 2 &&
                types.isThisExpression(callee.body.body[0].expression.callee.arguments[0]) &&
                types.isFunctionExpression(callee.body.body[0].expression.callee.arguments[1])
            ) {
                path.remove();
            }
        }
    };
    traverse(ast, visitor);

    const names_to_remove2 = [];

    const visitor2 = {
        FunctionDeclaration(path) {
            const { id, body } = path.node;
            if (
                body.body.length === 2 &&
                types.isFunctionDeclaration(body.body[0]) &&
                body.body[0].body.body.length === 2 &&
                types.isIfStatement(body.body[0].body.body[0]) &&
                types.isExpressionStatement(body.body[0].body.body[1]) &&
                types.isCallExpression(body.body[0].body.body[1].expression) &&
                types.isIdentifier(body.body[0].body.body[1].expression.callee, { name: body.body[0].id.name }) &&
                body.body[0].body.body[1].expression.arguments.length === 1 &&
                types.isUpdateExpression(body.body[0].body.body[1].expression.arguments[0]) &&
                types.isTryStatement(body.body[1]) &&
                body.body[1].block.body.length === 1 &&
                types.isIfStatement(body.body[1].block.body[0]) &&
                body.body[1].block.body[0].consequent.body.length === 1 &&
                types.isReturnStatement(body.body[1].block.body[0].consequent.body[0]) &&
                types.isIdentifier(body.body[1].block.body[0].consequent.body[0].argument, { name: body.body[0].id.name }) &&
                body.body[1].block.body[0].alternate.body.length === 1 &&
                types.isExpressionStatement(body.body[1].block.body[0].alternate.body[0]) &&
                types.isCallExpression(body.body[1].block.body[0].alternate.body[0].expression) &&
                types.isIdentifier(body.body[1].block.body[0].alternate.body[0].expression.callee, { name: body.body[0].id.name }) &&
                body.body[1].block.body[0].alternate.body[0].expression.arguments.length === 1 &&
                types.isNumericLiteral(body.body[1].block.body[0].alternate.body[0].expression.arguments[0], { value: 0 })
            ) {
                names_to_remove2.push(id.name);
                path.remove();
            }
        }
    };
    traverse(ast, visitor2);

    const visitor3 = {
        CallExpression(path) {
            const { callee } = path.node;
            if (
                types.isFunctionExpression(callee) &&
                callee.body.body.length === 3 &&
                types.isVariableDeclaration(callee.body.body[0]) &&
                types.isTryStatement(callee.body.body[1]) &&
                types.isExpressionStatement(callee.body.body[2]) &&
                types.isCallExpression(callee.body.body[2].expression) &&
                types.isMemberExpression(callee.body.body[2].expression.callee) &&
                types.isIdentifier(callee.body.body[2].expression.callee.property, { name: 'setInterval' }) &&
                callee.body.body[2].expression.arguments.length === 2 &&
                types.isIdentifier(callee.body.body[2].expression.arguments[0]) &&
                names_to_remove2.includes(callee.body.body[2].expression.arguments[0].name) &&
                types.isNumericLiteral(callee.body.body[2].expression.arguments[1])
            ) {
                path.remove();
            }
        }
    };
    traverse(ast, visitor3);
}

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
                control_flow_index_array_binding.path.parentPath.remove();

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

function restoreLogicalAndConditionalExpression(ast) {
    const visitor = {
        LogicalExpression(path) {
            const { parentPath } = path;
            const { left, right, operator } = path.node;
            if (parentPath.isExpressionStatement()) {
                const new_right = types.expressionStatement(right);
                const consequent = types.blockStatement([new_right]);
                const alternate = types.blockStatement([]);
                const if_statement = operator === '&&' ? types.ifStatement(left, consequent, alternate) : types.ifStatement(left, alternate, consequent);
                parentPath.replaceInline(if_statement);
            }
        },
        SequenceExpression(path) {
            const { parentPath } = path;
            const { expressions } = path.node;
            if (parentPath.isExpressionStatement()) {
                parentPath.replaceInline(expressions.map(types.expressionStatement));
            }
        },
        ConditionalExpression(path) {
            const { parentPath } = path;
            const { test, consequent, alternate } = path.node;
            if (parentPath.isExpressionStatement()) {
                const new_consequent = types.expressionStatement(consequent);
                const new_alternate = types.expressionStatement(alternate);
                const if_consequent = types.blockStatement([new_consequent]);
                const if_alternate = types.blockStatement([new_alternate]);
                const if_statement = types.ifStatement(test, if_consequent, if_alternate);
                parentPath.replaceInline(if_statement);
            }
        }
    };
    traverse(ast, visitor);
}

function obfuscator_io_deobfuscate(ast) {
    static_deobfuscate(ast);
    const { return_string_array_func_name } = findReturnStringArrayFunc(ast);
    const { decrypt_string_func_names } = findDecryptStringFunc(ast, return_string_array_func_name);
    const { decrypt_string_func_proxy_names } = findDecryptStringFuncProxy(ast, decrypt_string_func_names);
    findChangeStringArrayIIFE(ast, return_string_array_func_name);
    const { dispatcher_object_names, dispatcher_object_paths } = findDispatcherObject(ast);
    const decrypt_string_func_aliases = [...decrypt_string_func_names, ...decrypt_string_func_proxy_names];
    restoreCallExpression(ast, decrypt_string_func_aliases);
    static_deobfuscate(ast);
    restoreMemberExpression(ast, dispatcher_object_names, dispatcher_object_paths);
    static_deobfuscate(ast);
    removeSelfDefending(ast);
    restoreWhileSwitch(ast);
    restoreLogicalAndConditionalExpression(ast);
    static_deobfuscate(ast);
    rename_var_func_param(ast);
}