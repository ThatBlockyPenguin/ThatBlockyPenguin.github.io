import { h, toString as s } from "https://deno.land/x/jsx_to_string@v0.5.0/mod.ts";
import { join } from 'https://deno.land/std@0.200.0/path/mod.ts';

export function globals(page: string) {
  return {
    code: {
      inline: (id: string, language?: string) => s(<CodeBlock inline={true} language={language}> {getCode(id, page)} </CodeBlock>),
      block: (id: string, language?: string) => s(<CodeBlock inline={false} language={language}> {getCode(id, page)} </CodeBlock>),
    }
  }
};

function getCode(id: string, page: string) {
  try {
    return Deno.readTextFileSync(join('./dev/code', page, id));
  }catch {
    return id;
  }
}

function CodeBlock({ children, inline = true, language }: { children: JSX.Children, inline: boolean, language?: string }) {
  return inline
  ? <code className={'hljs ' + (language ? 'language-' + language : '')}>{children}</code>
  : <pre><CodeBlock inline={true} language={language}>{children}</CodeBlock></pre>;
}