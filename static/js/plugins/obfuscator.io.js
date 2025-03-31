function findReturnStringArrayFunc(ast) {
    let return_string_array_func_name;

    const visitor = {
        FunctionDeclaration(path) {
            const { body, id } = path.node;
            if (
                body.body.length === 3 &&
                types.isVariableDeclaration(body.body[0]) &&
                types.isArrayExpression(body.body[0].declarations[0].init) &&
                body.body[0].declarations[0].init.elements.length > 0 &&
                body.body[0].declarations[0].init.elements.every(types.isStringLiteral) &&
                types.isExpressionStatement(body.body[1]) &&
                types.isAssignmentExpression(body.body[1].expression) &&
                types.isIdentifier(body.body[1].expression.left, { name: id.name }) &&
                types.isFunctionExpression(body.body[1].expression.right) &&
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
            const { body, id } = path.node;
            if (
                body.body.length === 3 &&
                types.isVariableDeclaration(body.body[0]) &&
                types.isCallExpression(body.body[0].declarations[0].init) &&
                types.isIdentifier(body.body[0].declarations[0].init.callee, { name: return_string_array_func_name }) &&
                types.isExpressionStatement(body.body[1]) &&
                types.isAssignmentExpression(body.body[1].expression) &&
                types.isIdentifier(body.body[1].expression.left, { name: id.name }) &&
                types.isFunctionExpression(body.body[1].expression.right) &&
                types.isReturnStatement(body.body[2]) &&
                types.isCallExpression(body.body[2].argument) &&
                types.isIdentifier(body.body[2].argument.callee, { name: id.name })
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
        CallExpression(path) {
            const { parentPath } = path;
            const { callee, arguments } = path.node;
            if (
                arguments.length === 2 &&
                types.isIdentifier(arguments[0], { name: return_string_array_func_name }) &&
                types.isNumericLiteral(arguments[1]) &&
                types.isFunctionExpression(callee) &&
                callee.body.body.length === 2 &&
                types.isVariableDeclaration(callee.body.body[0]) &&
                types.isWhileStatement(callee.body.body[1]) &&
                parentPath.isExpressionStatement()
            ) {
                const code = generate(parentPath.node, { compact: true }).code;
                (0, eval)(code);
                parentPath.remove();
            }
        }
    };
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

function restoreObjDeclaration(ast) {
    const visitor = {
        VariableDeclarator(path) {
            const { id, init } = path.node;
            if (types.isObjectExpression(init) && init.properties.length === 0) {
                const binding = path.scope.getBinding(id.name);
                const { constant, referenced, referencePaths } = binding;
                if (
                    constant &&
                    referenced &&
                    referencePaths.length >= 2 &&
                    referencePaths.slice(0, -1).every(path => path.key === 'object' && path.parentPath.isMemberExpression() && path.parentPath.parentPath.isAssignmentExpression({ operator: '=' }) && path.parentPath.parentPath.parentPath.isExpressionStatement())
                ) {
                    const properties = binding.referencePaths.slice(0, -1).map(path => {
                        const property_name = path.getSibling('property').node.name;
                        const property_value = path.parentPath.parentPath.node.right;
                        return types.objectProperty(types.stringLiteral(property_name), property_value);
                    })
                    const obj_expr = types.objectExpression(properties);
                    referencePaths.at(-1).replaceInline(obj_expr);
                    referencePaths.slice(0, -1).forEach(path => path.parentPath.parentPath.parentPath.remove());
                    path.remove();
                }
            }
        }
    };
    traverse(ast, visitor);
}

function findDispatcherObj(ast) {
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
    const visitor = {
        VariableDeclarator(path) {
            const { id, init } = path.node;
            if (
                types.isCallExpression(init) &&
                types.isFunctionExpression(init.callee) &&
                init.callee.body.body.length === 2 &&
                types.isVariableDeclaration(init.callee.body.body[0]) &&
                types.isBooleanLiteral(init.callee.body.body[0].declarations[0].init, { value: true }) &&
                types.isReturnStatement(init.callee.body.body[1]) &&
                types.isFunctionExpression(init.callee.body.body[1].argument)
            ) {
                const binding = path.scope.getBinding(id.name);
                const ref = binding.referencePaths[0];
                types.assertCallExpression(ref.parent);
                if (ref.parentPath.parentPath.isVariableDeclarator()) {
                    const binding1 = ref.scope.getBinding(ref.parentPath.parent.id.name);
                    const ref1 = binding1.referencePaths.at(-1);
                    types.assertCallExpression(ref1.parent);
                    types.assertExpressionStatement(ref1.parentPath.parent);
                    ref1.parentPath.parentPath.remove();
                    ref.parentPath.parentPath.remove();
                    path.remove();
                } else if (ref.parentPath.parentPath.isCallExpression()) {
                    types.assertExpressionStatement(ref.parentPath.parentPath.parent);
                    ref.parentPath.parentPath.parentPath.remove();
                    path.remove();
                } else {
                    console.error(`Unsupported self-defending code: ${ref.parentPath.parentPath.type}`);
                }
            }
        },
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
            const { callee, arguments } = path.node;
            if (
                types.isMemberExpression(callee) &&
                types.isIdentifier(callee.object) &&
                types.isIdentifier(callee.property, { name: 'setInterval' }) &&
                arguments.length === 2 &&
                types.isIdentifier(arguments[0]) &&
                names_to_remove2.includes(arguments[0].name) &&
                types.isNumericLiteral(arguments[1]) &&
                path.parentPath.isExpressionStatement() &&
                path.parentPath.parentPath.isBlockStatement() &&
                path.parentPath.parentPath.parentPath.isFunctionExpression() &&
                path.parentPath.parentPath.parentPath.parentPath.isCallExpression() &&
                path.parentPath.parentPath.parentPath.parentPath.parentPath.isExpressionStatement()
            ) {
                path.parentPath.parentPath.parentPath.parentPath.parentPath.remove();
            }
        }
    };
    traverse(ast, visitor3);
}

function restoreLogicalAndConditionalExpression(ast) {
    const visitor = {
        LogicalExpression(path) {
            const { parentPath } = path;
            const { left, right, operator } = path.node;
            if (parentPath.isExpressionStatement()) {
                if (operator === '&&') {
                    const if_stmt = types.ifStatement(left, types.blockStatement([types.expressionStatement(right)]), null);
                    parentPath.replaceInline(if_stmt);
                } else {
                    const if_stmt = types.ifStatement(types.unaryExpression('!', left, true), types.blockStatement([types.expressionStatement(right)]), null);
                    parentPath.replaceInline(if_stmt);
                }
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
    const decrypt_string_func_aliases = [...decrypt_string_func_names, ...decrypt_string_func_proxy_names];
    restoreCallExpression(ast, decrypt_string_func_aliases);
    static_deobfuscate(ast);
    restoreObjDeclaration(ast);
    const { dispatcher_object_names, dispatcher_object_paths } = findDispatcherObj(ast);
    restoreMemberExpression(ast, dispatcher_object_names, dispatcher_object_paths);
    static_deobfuscate(ast);
    removeSelfDefending(ast);
    restoreWhileSwitch(ast);
    restoreLogicalAndConditionalExpression(ast);
    static_deobfuscate(ast);
    rename_var_func_param(ast);
}