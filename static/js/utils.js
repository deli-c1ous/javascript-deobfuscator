import { inputEditor, outputEditor } from "./page.js";


function transform(callback) {
    const code = inputEditor.getValue();
    const ast = parse(code);

    callback(ast);

    const newCode = generate(ast).code;
    outputEditor.setValue(newCode);
}

export { transform };