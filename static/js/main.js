async function fetchCode(filepath) {
    const response = await fetch(filepath);
    return await response.text();
}

const filepaths = [
    'static_deobfuscate.js',
    'obfuscator.io.js',
    'while_switch.js',
    'for_switch.js',
    'logical_sequence_expression.js',
    'for_if_else.js',
];
const [
    static_deobfuscate_example,
    obfuscator_io_example,
    while_switch_example,
    for_switch_example,
    logical_sequence_expression_example,
    for_if_else_example,
] = await Promise.all(filepaths.map(filepath => fetchCode(`static/js/example/${filepath}`)));

export {
    static_deobfuscate_example,
    obfuscator_io_example,
    while_switch_example,
    for_switch_example,
    logical_sequence_expression_example,
    for_if_else_example,
};