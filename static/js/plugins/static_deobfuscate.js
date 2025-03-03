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
        // 标识符重命名
        Scope(path) {
            if (rename) {
                path.scope.crawl();
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
            if (path.parentPath.isExpressionStatement()) {
                path.parentPath.replaceInline(path.node.expressions.map(types.expressionStatement));
            } else if (path.parentPath.isReturnStatement()) {
                path.parentPath.insertBefore(path.node.expressions.slice(0, -1).map(types.expressionStatement));
                path.replaceInline(path.node.expressions[path.node.expressions.length - 1]);
            } else if (path.key === 'test') {
                path.getStatementParent().insertBefore(path.node.expressions.slice(0, -1).map(types.expressionStatement));
                path.replaceInline(path.node.expressions[path.node.expressions.length - 1]);
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
        // 函数的变量声明还原为函数声明
        VariableDeclarator(path) {
            const { id, init } = path.node;
            if (types.isFunctionExpression(init)) {
                const function_declaration = types.functionDeclaration(id, init.params, init.body, init.generator, init.async);
                path.parentPath.insertBefore(function_declaration);
                path.remove();
            }
        },
        // 方括号属性还原为点属性
        MemberExpression(path) {
            const { computed, property } = path.node;
            if (computed === true && types.isStringLiteral(property)) {
                path.node.computed = false;
                path.node.property = types.identifier(property.value);
            }
        }
    };
    traverse(ast, visitor);
}