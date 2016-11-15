if (!Object.forEach) {
    Object.forEach = function (obj, c) {
        Object.keys(obj).forEach((key) => {
            c(obj[key], key);
        });
    };
}