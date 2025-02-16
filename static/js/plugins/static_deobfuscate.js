const types = Babel.packages.types;
const traverse = Babel.packages.traverse.default;
const parse = Babel.packages.parser.parse;
const generate = Babel.packages.generator.default;


function static_deobfuscate(ast, { rename = false, hexadecimal_only = true } = {}) {
    let variable_count = 0;
    let function_count = 0;
    let parameter_count = 0;

    function evaluateAndReplace(path) {
        const { confident, value } = path.evaluate();
        if (confident) {
            const old_node = path.node;
            path.replaceInline(types.valueToNode(value));
            if (path.type === old_node.type) {
                path.skip();
            }
        }
    }

    function canEvaluate(path) {
        if (path.isBinaryExpression() || path.isLogicalExpression()) {
            return canEvaluate(path.get('left')) && canEvaluate(path.get('right'));
        } else if (path.isUnaryExpression()) {
            return canEvaluate(path.get('argument'));
        } else if (path.isSequenceExpression()) {
            return path.get('expressions').every(canEvaluate);
        } else if (path.isConditionalExpression()) {
            return canEvaluate(path.get('test')) && canEvaluate(path.get('consequent')) && canEvaluate(path.get('alternate'));
        } else {
            return !(path.isCallExpression() || path.isIdentifier() || path.isMemberExpression() || path.isAssignmentExpression() || path.isUpdateExpression());
        }
    }

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
            value = value.replaceAll('\\', '\\\\');
            let quote;
            if (!value.includes('"')) {
                quote = '"';
            } else if (!value.includes("'")) {
                quote = "'";
            } else {
                const double_quote_count = value.split('"').length - 1;
                const single_quote_count = value.split("'").length - 1;
                if (double_quote_count > single_quote_count) {
                    quote = "'";
                    value = value.replaceAll("'", "\\'");
                } else {
                    quote = '"';
                    value = value.replaceAll('"', '\\"');
                }
            }
            path.node.extra.raw = quote + value + quote;
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
            if (canEvaluate(path)) {
                evaluateAndReplace(path);
            }
        },
        ConditionalExpression(path) {
            if (canEvaluate(path.get('test'))) {
                const { confident, value } = path.get('test').evaluate();
                if (confident) {
                    if (value) {
                        path.replaceInline(path.node.consequent);
                    } else {
                        path.replaceInline(path.node.alternate);
                    }
                }
            }
        },
        // 移除空语句
        EmptyStatement(path) {
            path.remove();
        },
        IfStatement(path) {
            // 块语句包装
            if (!path.get('consequent').isBlockStatement()) {
                path.node.consequent = types.blockStatement([path.node.consequent]);
            }
            if (path.node.alternate && !path.get('alternate').isBlockStatement() && !path.get('alternate').isIfStatement()) {
                path.node.alternate = types.blockStatement([path.node.alternate]);
            }
            // 无效if语句还原
            if (canEvaluate(path.get('test'))) {
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
            }
            // 无语句体的if语句还原
            else {
                if (path.node.alternate?.body?.length === 0) {
                    path.get('alternate').remove();
                }
                if (path.node.consequent.body.length === 0 && path.node.alternate === null) {
                    if (isMeaningfulExpression(path.get('test'))) {
                        const expression_paths = path.get('test').isSequenceExpression() ? path.get('test.expressions') : [path.get('test')];
                        const meaningful_expression_paths = expression_paths.filter(isMeaningfulExpression);
                        const meaningful_expressions = meaningful_expression_paths.map(expression_path => types.expressionStatement(expression_path.node));
                        path.replaceInline(meaningful_expressions);
                    } else {
                        path.remove();
                    }
                }
            }
        },
        Scope(path) {
            if (rename) {
                path.scope.crawl();
                for (const binding of Object.values(path.scope.bindings)) {
                    // 标识符重命名
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
                path.replaceInline(path.node.expressions.map(expression => types.expressionStatement(expression)));
            } else if (path.parentPath.isReturnStatement()) {
                path.parentPath.insertBefore(path.node.expressions.slice(0, -1).map(expression => types.expressionStatement(expression)));
                path.replaceInline(path.node.expressions[path.node.expressions.length - 1]);
            }
        },
        // 移除无效的表达式语句
        ExpressionStatement(path) {
            if (!isMeaningfulExpression(path.get('expression'))) {
                path.remove();
            }
        },
        ForStatement(path) {
            // 块语句包装
            if (!path.get('body').isBlockStatement()) {
                path.node.body = types.blockStatement([path.node.body]);
            }
        },
        WhileStatement(path) {
            // 块语句包装
            if (!path.get('body').isBlockStatement()) {
                path.node.body = types.blockStatement([path.node.body]);
            }
        }
    };
    traverse(ast, visitor);
}