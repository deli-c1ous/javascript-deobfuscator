import {
    static_deobfuscate_demo_code,
    obfuscator_io_demo_code,
    jsjiami_v6_demo_code,
    jsjiami_v7_demo_code,
    control_flow_flatten_demo_code1,
    control_flow_flatten_demo_code2,
    control_flow_flatten_demo_code3,
    control_flow_flatten_demo_code4,
} from "./main.js";
import { transform } from "./utils.js";


const regions = document.querySelectorAll('.region');
const inputTab = document.querySelector('#input-tab');
const outputTab = document.querySelector('#output-tab');
const inputEditorElement = document.querySelector('#input-editor');
const outputEditorElement = document.querySelector('#output-editor');
const highlightToggleButton = document.querySelector('#highlight-toggle');
const textElement = document.querySelector('#text');
const processButton = document.querySelector('#process-button');
const copyPasteButton = document.querySelector('#copy-paste-button');

let nowActiveRegion = regions[0];
const inputEditor = CodeMirror(inputEditorElement, {
    value: static_deobfuscate_demo_code,
    mode: 'javascript',
    theme: 'default',
    lineNumbers: true,
    lineWrapping: true,
});
const outputEditor = CodeMirror(outputEditorElement, {
    mode: 'javascript',
    theme: 'default',
    lineNumbers: true,
    readOnly: true,
    lineWrapping: true,
});

inputEditorElement.style.display = 'block';
outputEditorElement.style.display = 'none';
regions.forEach(region => {
    region.addEventListener('click', event => {
        nowActiveRegion.classList.remove('active');
        nowActiveRegion = event.target;
        nowActiveRegion.classList.add('active');

        switch (nowActiveRegion.id) {
            case 'static-deobfuscate':
                inputEditor.setValue(static_deobfuscate_demo_code);
                break;
            case 'obfuscator.io':
                inputEditor.setValue(obfuscator_io_demo_code);
                break;
            case 'jsjiami.com.v6':
                inputEditor.setValue(jsjiami_v6_demo_code);
                break;
            case 'jsjiami.com.v7':
                inputEditor.setValue(jsjiami_v7_demo_code);
                break;
            case 'controlFlowFlatten1':
                inputEditor.setValue(control_flow_flatten_demo_code1);
                break;
            case 'controlFlowFlatten2':
                inputEditor.setValue(control_flow_flatten_demo_code2);
                break;
            case 'controlFlowFlatten3':
                inputEditor.setValue(control_flow_flatten_demo_code3);
                break;
            case 'controlFlowFlatten4':
                inputEditor.setValue(control_flow_flatten_demo_code4);
                break;
        }
        inputTab.click();
    });
});
inputTab.addEventListener('click', () => {
    inputEditorElement.style.display = 'block';
    outputEditorElement.style.display = 'none';
    inputEditor.refresh();
    inputTab.classList.add('active');
    outputTab.classList.remove('active');
});
outputTab.addEventListener('click', () => {
    inputEditorElement.style.display = 'none';
    outputEditorElement.style.display = 'block';
    outputEditor.refresh();
    inputTab.classList.remove('active');
    outputTab.classList.add('active');
});
highlightToggleButton.addEventListener('change', () => {
    textElement.textContent = highlightToggleButton.checked ? '全部' : '仅十六进制';
});
processButton.addEventListener('click', () => {
    const checkAll = highlightToggleButton.checked;
    try {
        switch (nowActiveRegion.id) {
            case 'static-deobfuscate':
                transform(ast => {
                    static_deobfuscate(ast, {
                        rename: true,
                        hexadecimal_only: !checkAll,
                    });
                });
                break;
            case 'obfuscator.io':
                transform(ast => {
                    static_deobfuscate(ast);
                    const [return_array_function_name, code_str1] = handleReturnArrayFunction(ast);
                    const [decrypt_string_function_names, code_str2] = handleDecryptStringFunction(ast, return_array_function_name);
                    const code_str3 = handleChangeArrayIIFE(ast, return_array_function_name)
                    restoreCallExpression(ast, decrypt_string_function_names, code_str1, code_str2, code_str3);
                    restoreMemberExpression(ast);
                    static_deobfuscate(ast);
                    removeSelfDefending(ast);
                    deControlFlowFlatten(ast);
                    static_deobfuscate(ast, {
                        rename: true,
                        hexadecimal_only: !checkAll,
                    });
                });
                break;
            case 'jsjiami.com.v6':
                transform(ast => {
                    static_deobfuscate(ast);
                    const [array_name, code_str1] = handleArrayDeclaration_v6(ast);
                    const [decrypt_string_function_names, code_str2] = handleDecryptStringFunctionDeclaration_v6(ast, array_name);
                    const code_str3 = handleChangeArrayIIFE_v6(ast, array_name);
                    restoreCallExpression(ast, decrypt_string_function_names, code_str1, code_str2, code_str3);
                    restoreMemberExpression(ast);
                    static_deobfuscate(ast);
                    removeSelfDefending(ast);
                    deControlFlowFlatten(ast);
                    static_deobfuscate(ast, {
                        rename: true,
                        hexadecimal_only: !checkAll,
                    });
                });
                break;
            case 'jsjiami.com.v7':
                transform(ast => {
                    static_deobfuscate(ast);
                    const [return_array_function_name, code_str1] = handleReturnArrayFunction_v7(ast);
                    const [decrypt_string_function_names, code_str2] = handleDecryptStringFunction(ast, return_array_function_name);
                    const code_str3 = handleChangeArrayIIFE_v7(ast, return_array_function_name);
                    restoreCallExpression(ast, decrypt_string_function_names, code_str1, code_str2, code_str3);
                    restoreMemberExpression(ast);
                    static_deobfuscate(ast);
                    removeSelfDefending(ast);
                    deControlFlowFlatten(ast);
                    static_deobfuscate(ast, {
                        rename: true,
                        hexadecimal_only: !checkAll,
                    });
                });
                break;
            case 'controlFlowFlatten1':
                transform(ast => {
                    static_deobfuscate(ast);
                    deControlFlowFlatten(ast);
                    static_deobfuscate(ast, {
                        rename: true,
                        hexadecimal_only: !checkAll,
                    });
                });
                break;
            case 'controlFlowFlatten2':
                transform(ast => {
                    static_deobfuscate(ast);
                    const visitor1 = {
                        ForStatement(path) {
                            if (path.get('body.body').length === 1 && path.get('body.body.0').isSwitchStatement()) {
                                deControlFlowFlatten2(path);
                            }
                        }
                    };
                    traverse(ast, visitor1);
                    static_deobfuscate(ast, {
                        rename: true,
                        hexadecimal_only: !checkAll,
                    });
                });
                break;
            case 'controlFlowFlatten3':
                transform(ast => {
                    static_deobfuscate(ast);
                    const visitor = {
                        LogicalExpression: {
                            exit(path) {
                                if (path.key !== 'test') {
                                    deControlFlowFlatten3(path);
                                }
                            }
                        }
                    };
                    traverse(ast, visitor);
                    const visitor2 = {
                        SequenceExpression(path) {
                            if (path.parentPath.isExpressionStatement()) {
                                path.parentPath.replaceInline(path.node.expressions.map(expression => types.isExpression(expression) ? types.expressionStatement(expression) : expression));
                            }
                        }
                    }
                    traverse(ast, visitor2);
                    static_deobfuscate(ast, {
                        rename: true,
                        hexadecimal_only: !checkAll,
                    });
                });
                break;
            case 'controlFlowFlatten4':
                transform(ast => {
                    static_deobfuscate(ast);
                    const visitor = {
                        ForStatement(path) {
                            if (path.get('body.body').length === 1 && path.get('body.body.0').isIfStatement()) {
                                deControlFlowFlatten4(path);
                            }
                        }
                    };
                    traverse(ast, visitor);
                    static_deobfuscate(ast, {
                        rename: true,
                        hexadecimal_only: !checkAll,
                    });
                });
                break;
        }
    } catch (e) {
        outputEditor.setValue(e.toString());
    }
    outputTab.click();
});
copyPasteButton.addEventListener('click', () => {
    const isInputVisible = inputEditorElement.style.display === 'block';
    if (isInputVisible) {
        navigator.clipboard.readText().then(text => {
            inputEditor.setValue(text);
        });
    } else {
        const code = outputEditor.getValue();
        navigator.clipboard.writeText(code).then(() => {
            alert('复制成功！');
        })
    }
});

export {
    inputEditor,
    outputEditor,
};
