import { PSVGElement } from './element';

export function parsePSVG(str: string): PSVGElement[] {
  str = str.replace(/<!--[^\0]*?-->/gm, '');
  let i: number = 0;
  const elts: PSVGElement[] = [];
  while (i <= str.length) {
    if (str[i] == '<') {
      let j = i + 1;
      let bodyStart = -1;
      let bodyEnd = -1;
      let quote = false;
      let lvl = 0;

      const getTagName = (open: string) => open.trim().split(' ')[0].trimEnd();

      const getAttributes = (open: string) => {
        // oneliner doesn't work for safari:
        // return Object['fromEntries'](Array['from'](open.split(" ").slice(1).join(" ")['matchAll'](/(^| )([^ ]+?)\="([^"]*)"/g)).map((x:string)=>x.slice(2)));

        // stupid polyfill for safari:
        const attrsStr = open.split(' ').slice(1).join(' ');

        const matchAll = attrsStr.matchAll
          ? (re: RegExp) => attrsStr.matchAll(re)
          : (re: RegExp) => {
              const ms: RegExpMatchArray[] = [];
              while (1) {
                const m = re.exec(attrsStr);
                if (m) ms.push(m);
                else break;
              }
              return ms;
            };

        const fromEntries =
          Object.fromEntries ||
          ((a: any) => {
            const o = {};
            a.map(([key, value]) => (o[key] = value));
            return o;
          });

        // @ts-ignore
        // prettier-ignore
        return fromEntries(Array['from'](matchAll(/(^| )([^ ]+?)\ *= *"([^"]*)"/g)).map((x: string) => x.slice(2)));
      };

      const parseNormalTag = (): void => {
        const open = str.slice(i + 1, bodyStart - 1);
        const body = str.slice(bodyStart, bodyEnd);
        const elt: PSVGElement = {
          tagName: getTagName(open),
          attributes: getAttributes(open),
          children: parsePSVG(body),
          innerHTML: body,
        };
        elts.push(elt);
      };

      const parseSelfClosingTag = (): void => {
        const open = str.slice(i + 1, j);
        const elt: PSVGElement = {
          tagName: getTagName(open),
          attributes: getAttributes(open),
          children: [],
          innerHTML: '',
        };
        elts.push(elt);
      };

      while (j <= str.length) {
        if (str[j] == '\\') {
          j++;
        }
        if (str[j] == '"') {
          quote = !quote;
        }
        if (!quote) {
          if (str[j] == '>' && lvl == 0 && bodyStart == -1) {
            bodyStart = j + 1;
          }

          if (str[j] == '<') {
            if (str[j + 1] == '/') {
              lvl--;
              if (lvl == -1) {
                bodyEnd = j;
              }
              while (str[j] != '>') {
                j++;
              }
              if (lvl == -1) {
                parseNormalTag();
                i = j;
                break;
              }
            } else {
              lvl++;
            }
          } else if (str[j] == '/' && str[j + 1] == '>') {
            lvl--;
            if (lvl == -1) {
              parseSelfClosingTag();
              i = j;
              break;
            }
          }
        }
        j++;
      }
    }
    i++;
  }
  return elts;
}
