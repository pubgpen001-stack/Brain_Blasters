const romanMap = [
    { v: 1000, s: 'M' },
    { v: 900, s: 'CM' },
    { v: 500, s: 'D' },
    { v: 400, s: 'CD' },
    { v: 100, s: 'C' },
    { v: 90, s: 'XC' },
    { v: 50, s: 'L' },
    { v: 40, s: 'XL' },
    { v: 10, s: 'X' },
    { v: 9, s: 'IX' },
    { v: 5, s: 'V' },
    { v: 4, s: 'IV' },
    { v: 1, s: 'I' }
];

export const toRoman = (num) => {
    let result = '';
    for (const { v, s } of romanMap) {
        while (num >= v) {
            result += s;
            num -= v;
        }
    }
    return result;
};

export const getRandomRoman = (max) => {
    const num = Math.floor(Math.random() * max) + 1;
    return { num, roman: toRoman(num) };
};
