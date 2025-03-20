import {
    static_deobfuscate_example,
    obfuscator_io_example,
    while_switch_example,
    for_if_else_example,
    for_switch_example,
    logical_sequence_expression_example,
} from "./main.js";
import { transform } from "./utils.js";

const regions = document.querySelectorAll('.region');
const inputTab = document.querySelector('#input-tab');
const outputTab = document.querySelector('#output-tab');
const inputEditorElement = document.querySelector('#input-editor');
const outputEditorElement = document.querySelector('#output-editor');
const renameAllCheckbox = document.querySelector('#rename-all-checkbox');
const processButton = document.querySelector('#process-button');
const copyPasteButton = document.querySelector('#copy-paste-button');

let nowActiveRegion = regions[0];
const inputEditor = CodeMirror(inputEditorElement, {
    value: static_deobfuscate_example,
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
                inputEditor.setValue(static_deobfuscate_example);
                break;
            case 'obfuscator.io':
                inputEditor.setValue(obfuscator_io_example);
                break;
            case 'while-switch':
                inputEditor.setValue(while_switch_example);
                break;
            case 'for-switch':
                inputEditor.setValue(for_switch_example);
                break;
            case 'logical-sequence-expression':
                inputEditor.setValue(logical_sequence_expression_example);
                break;
            case 'for-if-else':
                inputEditor.setValue(for_if_else_example);
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
processButton.addEventListener('click', () => {
    const renameAll = renameAllCheckbox.checked;
    try {
        switch (nowActiveRegion.id) {
            case 'static-deobfuscate':
                transform(ast => {
                    static_deobfuscate(ast);
                    rename_var_func_param(ast, { hexadecimal_only: !renameAll });
                });
                break;
            case 'obfuscator.io':
                transform(ast => {
                    obfuscator_io_deobfuscate(ast);
                });
                break;
            case 'while-switch':
                transform(ast => {
                    static_deobfuscate(ast);
                    restoreWhileSwitch(ast);
                    static_deobfuscate(ast);
                    rename_var_func_param(ast, { hexadecimal_only: !renameAll });
                });
                break;
            case 'for-switch':
                transform(ast => {
                    static_deobfuscate(ast);
                    restoreForSwitch(ast);
                    static_deobfuscate(ast);
                    rename_var_func_param(ast, { hexadecimal_only: !renameAll });
                });
                break;
            case 'logical-sequence-expression':
                transform(ast => {
                    static_deobfuscate(ast);
                    restoreLogicalSequenceExpression(ast);
                    static_deobfuscate(ast);
                    rename_var_func_param(ast, { hexadecimal_only: !renameAll });
                });
                break;
            case 'for-if-else':
                transform(ast => {
                    static_deobfuscate(ast);
                    restoreForIfElse(ast);
                    static_deobfuscate(ast);
                    rename_var_func_param(ast, { hexadecimal_only: !renameAll });
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
