function handleReturnArrayFunction(ast) {
    let return_array_function_name, code_str;
    const visitor = {
        FunctionDeclaration(path) {
            if (
                types.isVariableDeclaration(path.node.body.body[0]) &&
                path.node.body.body[1]?.expression?.left?.name === path.node.id.name &&
                path.node.body.body[2]?.argument?.callee?.name === path.node.id.name &&
                path.node.body.body.length === 3 &&
                path.node.params.length === 0
            ) {
                return_array_function_name = path.node.id.name;
                code_str = generate(path.node, {
                    compact: true,
                }).code;
                path.remove();
            }
        },
    }
    traverse(ast, visitor);
    return [return_array_function_name, code_str];
}

function handleDecryptStringFunction(ast, return_array_function_name) {
    let decrypt_string_function_names = [], code_str = '';
    const visitor = {
        FunctionDeclaration(path) {
            if (
                path.node.body.body[0]?.declarations?.[0]?.init?.callee?.name === return_array_function_name &&
                path.node.body.body[1]?.expression?.left?.name === path.node.id.name &&
                path.node.body.body[2]?.argument?.callee?.name === path.node.id.name &&
                path.node.body.body.length === 3
            ) {
                decrypt_string_function_names.push(path.node.id.name);
                code_str += generate(path.node, {
                    compact: true,
                }).code;
                path.remove();
            }
        },
    }
    traverse(ast, visitor);
    return [decrypt_string_function_names, code_str];
}

function handleChangeArrayIIFE(ast, return_array_function_name) {
    let code_str;
    const visitor = {
        ExpressionStatement(path) {
            if (
                path.node.expression.arguments?.[0]?.name === return_array_function_name &&
                types.isNumericLiteral(path.node.expression.arguments?.[1])
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

function restoreCallExpression(ast, decrypt_string_function_names, code_str1, code_str2, code_str3) {
    const caller_callee_map = new Map();
    const visitor1 = {
        VariableDeclarator(path) {
            if (types.isIdentifier(path.node.init)) {
                caller_callee_map.set(path.node.id.name, {
                    callee_name: path.node.init.name,
                    callee_path: path,
                });
            }
        },
        FunctionDeclaration(path) {
            if (types.isIdentifier(path.node.body.body[0]?.argument?.callee)) {
                caller_callee_map.set(path.node.id.name, {
                    callee_name: path.node.body.body[0].argument.callee.name,
                    callee_path: path,
                });
            }
        }
    };
    traverse(ast, visitor1);

    eval(code_str1);
    eval(code_str2);

    const decrypt_string_function_alias = [...decrypt_string_function_names];
    let current_alias = [...decrypt_string_function_names];
    while (current_alias.length > 0) {
        const next_alias = [];
        for (const [caller_name, { callee_name, callee_path }] of caller_callee_map) {
            if (current_alias.includes(callee_name)) {
                next_alias.push(caller_name);
                eval(callee_path.toString());
                callee_path.remove();
            }
        }
        decrypt_string_function_alias.push(...next_alias);
        current_alias = next_alias;
    }

    eval(code_str3);

    const visitor2 = {
        CallExpression(path) {
            if (decrypt_string_function_alias.includes(path.node.callee.name)) {
                const value = eval(path.toString());
                const node = types.valueToNode(value);
                path.replaceInline(node);
            }
        }
    };
    traverse(ast, visitor2);
}

function restoreMemberExpression(ast) {
    const info_object_map = new Map();
    const visitor1 = {
        VariableDeclarator(path) {
            if (/^[a-z]{5}$/i.test(path.node.init?.properties?.[0]?.key.value)) {
                const info_object_name = path.node.id.name;
                const info_object_properties = path.node.init.properties;
                info_object_map.set(info_object_name, {
                    info_object_path: path,
                    info_object_properties: info_object_properties,
                });
                eval(path.toString());
            }
        }
    };
    traverse(ast, visitor1);

    const visitor2 = {
        MemberExpression(path) {
            if (info_object_map.has(path.node.object.name)) {
                const value = eval(path.toString());
                const node = types.valueToNode(value);
                path.replaceInline(node);
            }
        },
        CallExpression(path) {
            if (info_object_map.has(path.node.callee.object?.name)) {
                const { info_object_properties } = info_object_map.get(path.node.callee.object.name);
                const property = info_object_properties.find(prop => prop.key.value === path.node.callee.property.value);
                const expression = property.value.body.body[0].argument;
                let new_expression;
                if (expression.type === 'BinaryExpression') {
                    new_expression = types.binaryExpression(expression.operator, path.node.arguments[0], path.node.arguments[1]);
                } else if (expression.type === 'CallExpression') {
                    new_expression = types.callExpression(path.node.arguments[0], path.node.arguments.slice(1));
                } else {
                    console.log(666)
                }
                path.replaceInline(new_expression);
            }
        }
    };
    traverse(ast, visitor2);

    for (const { info_object_path } of info_object_map.values()) {
        info_object_path.remove();
    }
}

function removeSelfDefending(ast) {
    const names_to_remove = [];
    const visitor1 = {
        VariableDeclarator(path) {
            if (
                path.node.init?.callee?.body?.body?.[0]?.declarations?.[0]?.init?.value === true ||
                names_to_remove.includes(path.node.init?.callee?.name)
            ) {
                names_to_remove.push(path.node.id.name);
                path.remove();
            }
        },
        CallExpression(path) {
            if (
                names_to_remove.includes(path.node.callee.name) ||
                names_to_remove.includes(path.node.callee.body?.body?.[0]?.expression?.callee?.callee?.name)
            ) {
                path.remove();
            }
        }
    };
    traverse(ast, visitor1);

    const visitor2 = {
        FunctionDeclaration(path) {
            if (
                types.isIfStatement(path.node.body.body[0]?.body?.body?.[0]) &&
                types.isUpdateExpression(path.node.body.body[0]?.body?.body?.[1]?.expression?.arguments?.[0]) &&
                types.isTryStatement(path.node.body.body[1]) &&
                path.node.body.body.length === 2
            ) {
                path.remove();
            }
        },
        CallExpression(path) {
            if (
                types.isVariableDeclaration(path.node.callee.body?.body?.[0]) &&
                types.isTryStatement(path.node.callee.body?.body?.[1]) &&
                path.node.callee.body?.body?.[2]?.expression?.callee?.property?.value === 'setInterval' &&
                path.node.callee.body?.body?.length === 3
            ) {
                path.remove();
            }
        }
    }
    traverse(ast, visitor2);
}

function deControlFlowFlatten(ast) {
    const visitor = {
        WhileStatement(path) {
            if (
                path.node.test.value === true &&
                types.isSwitchStatement(path.node.body.body[0])
            ) {
                const switchStatement = path.node.body.body[0];
                const switchCases = switchStatement.cases;
                const controlFlowIndexArrayName = switchStatement.discriminant.object.name;
                const controlFlowIndexArrayBinding = path.scope.getBinding(controlFlowIndexArrayName);
                const controlFlowIndexArray = eval(controlFlowIndexArrayBinding.path.get('init').toString());
                controlFlowIndexArrayBinding.path.parentPath.remove();

                const new_body = [];
                controlFlowIndexArray.forEach(index => {
                    const switchCase = switchCases.find(case_ => case_.test.value === index);
                    const case_body = switchCase.consequent.filter(statement => !types.isContinueStatement(statement));
                    new_body.push(...case_body);
                });
                path.replaceInline(new_body);
            }
        }
    };
    traverse(ast, visitor);
}