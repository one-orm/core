if (!Object.values) {
    Object.values = function (o) {
        return Object.keys(o)
            .filter((key) => {
                return Object.hasOwnProperty.call(o, key);
            })
            .map((key) => {
                return o[key];
            });
    };
}