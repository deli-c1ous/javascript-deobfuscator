async function fetchCode(filepath) {
    const response = await fetch(filepath);
    return await response.text();
}

const filepaths = [
    'static_deobfuscate.js',
    'obfuscator.io.js',
    'jsjiami.com.v6.js',
    'jsjiami.com.v7.js',
    'control_flow_flatten1.js',
    'control_flow_flatten2.js',
    'control_flow_flatten3.js',
    'control_flow_flatten4.js',
];
const [
    static_deobfuscate_demo_code,
    obfuscator_io_demo_code,
    jsjiami_v6_demo_code,
    jsjiami_v7_demo_code,
    control_flow_flatten_demo_code1,
    control_flow_flatten_demo_code2,
    control_flow_flatten_demo_code3,
    control_flow_flatten_demo_code4,
] = await Promise.all(filepaths.map(filepath => fetchCode(`static/js/demo_code/${filepath}`)));

export {
    static_deobfuscate_demo_code,
    obfuscator_io_demo_code,
    jsjiami_v6_demo_code,
    jsjiami_v7_demo_code,
    control_flow_flatten_demo_code1,
    control_flow_flatten_demo_code2,
    control_flow_flatten_demo_code3,
    control_flow_flatten_demo_code4,
};