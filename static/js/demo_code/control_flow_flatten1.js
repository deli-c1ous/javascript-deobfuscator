var v13 = "0|5|1|2|3|4"["split"]("|"),
    v14 = 0;
while (true) {
    switch (v13[v14++]) {
        case "0":
            var v15 = v20["constructor"]["prototype"]["bind"](v20);
            continue;
        case "1":
            var v16 = v10[v17] || v15;
            continue;
        case "2":
            v15["__proto__"] = v20["bind"](v20);
            continue;
        case "3":
            v15["toString"] = v16["toString"]["bind"](v16);
            continue;
        case "4":
            v10[v17] = v15;
            continue;
        case "5":
            var v17 = v11[v12];
            continue;
    }
    break;
}