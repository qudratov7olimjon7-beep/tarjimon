// Pure converter: any Uzbek text (Cyrillic or current Latin) -> new 29-letter Uzbek Latin.
(function (root) {
  const TUTUQ = "ʼ";
  const APOS = "['‘’ʻʼ`´]";
  const CYR = {
    а:"a",б:"b",в:"v",г:"g",д:"d",ж:"j",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",
    о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"x",ҳ:"h",қ:"q",ғ:"ğ",ў:"ö",ш:"ş",
    щ:"şç",ч:"ç",ц:"s",ъ:TUTUQ,ь:"",ы:"i",э:"e",е:"e",ё:"yo",ю:"yu",я:"ya",
  };
  const isCyrLetter = (c) => !!c && /[\u0400-\u04FF]/.test(c);

  function cyrToLatin(text) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const lower = ch.toLowerCase();
      if (!(lower in CYR)) { out += ch; continue; }
      const prev = text[i - 1];
      let lat = CYR[lower];
      if (lower === "е" && (!isCyrLetter(prev) || /[аоуэиеёюяўъь]/i.test(prev))) lat = "ye";
      if (lower === "ц" && isCyrLetter(prev) && /[аоуэиеёюяў]/i.test(prev)) lat = "ts";
      if (ch !== lower && lat) {
        const next = text[i + 1];
        const allCaps = (next && next !== next.toLowerCase()) || (prev && isCyrLetter(prev) && prev !== prev.toLowerCase());
        lat = allCaps ? lat.toUpperCase() : lat[0].toUpperCase() + lat.slice(1);
      }
      out += lat;
    }
    return out;
  }

  function toNewUzbek(text) {
    let s = cyrToLatin(String(text));
    s = s.replace(new RegExp("([oOgG])" + APOS, "g"), (_, l) => ({ o: "ö", O: "Ö", g: "ğ", G: "Ğ" })[l]);
    s = s.replace(/sh/g, "ş").replace(/S[hH]/g, "Ş").replace(/ch/g, "ç").replace(/C[hH]/g, "Ç");
    s = s.replace(new RegExp("(\\p{L})" + APOS + "(?=\\p{L})", "gu"), "$1" + TUTUQ);
    return s;
  }

  const api = { toNewUzbek, cyrToLatin };
  if (typeof module !== "undefined") module.exports = api; else root.UzConvert = api;
})(this);
