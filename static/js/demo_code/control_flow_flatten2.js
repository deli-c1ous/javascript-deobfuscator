;
for (var OS, DO, S, mi, xj = 1, X, mv, mP, mR; xj;) switch (xj) {
    case 1:
        OS = function () {
            for (var xj = 19, O, mY, me; xj;) switch (xj) {
                case 1:
                    return 1;
                case 2:
                    me = "[native code]";
                    xj = 11;
                    break;
                case 3:
                    mv = 0;
                    xj = 18;
                    break;
                case 4:
                    mv = 0;
                    xj = 7;
                    break;
                case 5:
                    mv = 0;
                    xj = 8;
                    break;
                case 6:
                    xj = mY.length > 39 ? 3 : 15;
                    break;
                case 7:
                    return 1;
                case 8:
                    return 1;
                case 9:
                    mY = Math.random.toString();
                    xj = 6;
                    break;
                case 10:
                    xj = mY.indexOf(me) < 16 ? 4 : 23;
                    break;
                case 11:
                    xj = O.indexOf(me) < 16 ? 13 : 10;
                    break;
                case 12:
                    return 0;
                case 13:
                    mv = 0;
                    xj = 12;
                    break;
                case 14:
                    xj = O.length > 39 ? 22 : 20;
                    break;
                case 15:
                    xj = mY.length < 32 ? 5 : 2;
                    break;
                case 16:
                    mv = 0;
                    xj = 17;
                    break;
                case 17:
                    return 0;
                case 18:
                    return 0;
                case 19:
                    xj = !mv ? 24 : 21;
                    break;
                case 20:
                    (function () {
                        debugger
                    })();
                    xj = 25;
                    break;
                case 21:
                    O = alert.toString();
                    xj = 14;
                    break;
                case 22:
                    mv = 0;
                    xj = 1;
                    break;
                case 23:
                    return mv;
                case 24:
                    return 0;
                case 25:
                    xj = O.length < 32 ? 16 : 9;
                    break
            }
        };
        xj = 8;
        break;
    case 2:
        mP = document.getElementById("mineCount");
        xj = 9;
        break;
    case 3:
        DO.addEventListener("click", function () {
            for (var d, mN, xj = 9, x, e; xj;) switch (xj) {
                case 1:
                    X++;
                    xj = 4;
                    break;
                case 2:
                    d = Math.random() * 10 + mN;
                    xj = 6;
                    break;
                case 3:
                    mN = OS();
                    xj = 2;
                    break;
                case 4:
                    S.textContent = Math.floor(mi);
                    xj = 10;
                    break;
                case 5:
                    e = Date.now();
                    xj = 7;
                    break;
                case 6:
                    mi += d;
                    xj = 1;
                    break;
                case 7:
                    xj = e - x > 999 ? 8 : NaN;
                    break;
                case 8:
                    mv = 0;
                    xj = NaN;
                    break;
                case 9:
                    x = Date.now();
                    xj = 3;
                    break;
                case 10:
                    mP.textContent = X;
                    xj = 5;
                    break
            }
        });
        xj = 10;
        break;
    case 4:
        X = 0;
        xj = 6;
        break;
    case 5:
        mR = document.getElementById("testButton");
        xj = 3;
        break;
    case 6:
        mv = 1;
        xj = 7;
        break;
    case 7:
        S = document.getElementById("goldCount");
        xj = 2;
        break;
    case 8:
        mi = 0;
        xj = 4;
        break;
    case 9:
        DO = document.getElementById("mineButton");
        xj = 5;
        break;
    case 10:
        mR.addEventListener("click", function () {
            for (var xj = 8; xj;) switch (xj) {
                case 1:
                    alert("\u68C0\u6D4B\u5230\u4F5C\u5F0A\uFF0C\u8BF7\u7EE7\u7EED\u52A0\u6CB9\uFF01");
                    xj = NaN;
                    break;
                case 2:
                    alert("\u91D1\u5E01\u4E0D\u591F\uFF0C\u8BF7\u7EE7\u7EED\u6316\u77FF\uFF01");
                    xj = 7;
                    break;
                case 3:
                    xj = NaN;
                    break;
                case 4:
                    alert("\u606D\u559C\u60A8\uFF0C\u901A\u5173\u4E86\uFF01\u8BF7\u8BD5\u8BD5HOOK\u65B9\u5F0F\u8FC7\u5173\uFF01\u6316\u77FF\u603B\u6B21\u6570\uFF1A".concat(X));
                    xj = 3;
                    break;
                case 5:
                    xj = 3;
                    break;
                case 6:
                    console.log("\u606D\u559C\u60A8\uFF0C\u901A\u5173\u4E86\uFF01");
                    xj = 14;
                    break;
                case 7:
                    xj = NaN;
                    break;
                case 8:
                    xj = mi >= 100 && mv ? 10 : 11;
                    break;
                case 9:
                    console.log("hook\u88AB\u68C0\u6D4B\u5230\u4E86\u5662\uFF0C\u8BF7\u7EE7\u7EED\u52A0\u6CB9\uFF01");
                    xj = 1;
                    break;
                case 10:
                    xj = mi / X > 10 ? 6 : 12;
                    break;
                case 11:
                    xj = mi < 100 ? 13 : 9;
                    break;
                case 12:
                    console.log("\u606D\u559C\u60A8\uFF0C\u901A\u5173\u4E86\uFF0C\u8BF7\u8BD5\u8BD5HOOK\u65B9\u5F0F\u8FC7\u5173\uFF01");
                    xj = 4;
                    break;
                case 13:
                    console.log("\u91D1\u5E01\u4E0D\u591F\uFF0C\u8BF7\u8BD5\u8BD5HOOK\u65B9\u5F0F\u8FC7\u5173\uFF01");
                    xj = 2;
                    break;
                case 14:
                    alert("\u606D\u559C\u60A8\uFF0C\u901A\u8FC7HOOK\u65B9\u5F0F\u901A\u5173\u4E86\uFF01");
                    xj = 5;
                    break
            }
        });
        xj = NaN;
        break
}
