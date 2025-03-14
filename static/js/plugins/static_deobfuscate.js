const types = Babel.packages.types;
const traverse = Babel.packages.traverse.default;
const parse = Babel.packages.parser.parse;
const generate = Babel.packages.generator.default;

function static_deobfuscate(ast, { rename = false, hexadecimal_only = true } = {}) {
    let variable_count = 0;
    let function_count = 0;
    let parameter_count = 0;

    function isMeaningfulExpression(path) {
        if (path.isBinaryExpression()) {
            return isMeaningfulExpression(path.get('left')) || isMeaningfulExpression(path.get('right'));
        } else if (path.isUnaryExpression()) {
            return isMeaningfulExpression(path.get('argument'));
        } else if (path.isSequenceExpression()) {
            return path.get('expressions').some(isMeaningfulExpression);
        } else if (path.isLogicalExpression()) {
            return isMeaningfulExpression(path.get('left')) || isMeaningfulExpression(path.get('right'));
        } else if (path.isConditionalExpression()) {
            return isMeaningfulExpression(path.get('test')) || isMeaningfulExpression(path.get('consequent')) || isMeaningfulExpression(path.get('alternate'));
        } else {
            return path.isCallExpression() || path.isAssignmentExpression() || path.isUpdateExpression();
        }
    }

    const visitor = {
        // 字符串还原
        StringLiteral(path) {
            let value = path.node.value;
            if (!path.node.extra) {
                path.node.extra = {
                    rawValue: value,
                };
            }
            path.node.extra.raw = JSON.stringify(value);
        },
        TemplateLiteral(path) {
            for (const element of path.node.quasis) {
                element.value.raw = element.value.cooked;
            }
        },
        // 数值还原
        NumberLiteral(path) {
            delete path.node.extra;
        },
        // 表达式计算
        'BinaryExpression|UnaryExpression'(path) {
            const { confident, value } = path.evaluate();
            if (confident) {
                const old_node = path.node;
                path.replaceInline(types.valueToNode(value));
                if (path.type === old_node.type) {
                    path.skip();
                }
            }
        },
        ConditionalExpression(path) {
            const { confident, value } = path.get('test').evaluate();
            if (confident) {
                if (value) {
                    path.replaceInline(path.node.consequent);
                } else {
                    path.replaceInline(path.node.alternate);
                }
            } else {
                // 条件表达式还原为if语句
                const { parentPath } = path;
                const { test, consequent, alternate } = path.node;
                if (parentPath.isExpressionStatement()) {
                    const new_consequent = types.expressionStatement(consequent);
                    const new_alternate = types.expressionStatement(alternate);
                    const if_consequent = types.blockStatement([new_consequent]);
                    const if_alternate = types.blockStatement([new_alternate]);
                    const if_statement = types.ifStatement(test, if_consequent, if_alternate);
                    if (parentPath.isExpressionStatement()) {
                        parentPath.replaceInline(if_statement);
                    }
                }
            }
        },
        // 移除空语句
        EmptyStatement(path) {
            path.remove();
        },
        IfStatement(path) {
            const { consequent, alternate } = path.node;
            // 块语句包装
            if (!types.isBlockStatement(consequent)) {
                path.node.consequent = types.blockStatement([consequent]);
            }
            if (alternate && !types.isBlockStatement(alternate)) {
                path.node.alternate = types.blockStatement([alternate]);
            }
            // 无效if语句还原
            const { confident, value } = path.get('test').evaluate();
            if (confident) {
                if (value) {
                    path.replaceInline(path.node.consequent.body);
                } else if (path.node.alternate) {
                    path.replaceInline(path.node.alternate.body);
                } else {
                    path.remove();
                }
            }
            // 无语句体的if语句还原
            else {
                if (path.node.alternate?.body.length === 0) {
                    path.get('alternate').remove();
                }
                if (path.node.consequent.body.length === 0) {
                    if (path.node.alternate === null) {
                        path.replaceInline(types.expressionStatement(path.node.test));
                    } else {
                        const new_test = types.unaryExpression("!", path.node.test, true);
                        const new_if_statement = types.ifStatement(new_test, path.node.alternate, null);
                        path.replaceInline(new_if_statement);
                    }
                }
            }
        },
        // 变量重命名
        Scope(path) {
            path.scope.crawl();
            if (rename) {
                for (const binding of Object.values(path.scope.bindings)) {
                    const identifier_name = binding.identifier.name;
                    if (hexadecimal_only && !/_0x|__Ox/.test(identifier_name)) {
                        continue;
                    }
                    if (binding.kind === 'var' || binding.kind === 'let' || binding.kind === 'const') {
                        path.scope.rename(identifier_name, `v${variable_count++}`);
                    } else if (binding.kind === 'hoisted' || binding.kind === 'local') {
                        path.scope.rename(identifier_name, `f${function_count++}`);
                    } else if (binding.kind === 'param') {
                        path.scope.rename(identifier_name, `p${parameter_count++}`);
                    }
                }
            }
        },
        // 逗号表达式还原
        SequenceExpression(path) {
            const { parentPath } = path;
            const { expressions } = path.node;
            if (parentPath.isExpressionStatement()) {
                parentPath.replaceInline(expressions.map(types.expressionStatement));
            } else if (parentPath.isReturnStatement() || parentPath.isIfStatement()) {
                parentPath.insertBefore(expressions.slice(0, -1).map(types.expressionStatement));
                path.replaceInline(expressions[expressions.length - 1]);
            }
        },
        // 移除无效的表达式语句
        ExpressionStatement(path) {
            if (!isMeaningfulExpression(path.get('expression'))) {
                path.remove();
            }
        },
        // 块语句包装
        'ForStatement|WhileStatement'(path) {
            const { body } = path.node;
            if (!types.isBlockStatement(body)) {
                path.node.body = types.blockStatement([body]);
            }
        },
        // 方括号属性还原为点属性
        MemberExpression: {
            exit(path) {
                const { computed, property } = path.node;
                if (computed && types.isStringLiteral(property) && types.isValidIdentifier(property.value)) {
                    path.node.computed = false;
                    path.node.property = types.identifier(property.value);
                }
            }
        },
        // 逻辑表达式还原为if语句
        LogicalExpression(path) {
            const { parentPath } = path;
            const { left, right, operator } = path.node;
            if (parentPath.isExpressionStatement()) {
                const new_right = types.expressionStatement(right);
                const consequent = types.blockStatement([new_right]);
                const alternate = types.blockStatement([]);
                const if_statement = operator === '&&' ? types.ifStatement(left, consequent, alternate) : types.ifStatement(left, alternate, consequent);
                if (parentPath.isExpressionStatement()) {
                    parentPath.replaceInline(if_statement);
                }
            }
        },
    };
    traverse(ast, visitor);
}