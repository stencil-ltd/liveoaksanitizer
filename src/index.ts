#!/usr/bin/env node

import yargs from "yargs";
import _, { join, noop } from "lodash";
import { promises as fs } from "fs";

const args = yargs
  .scriptName("sanitize")
  .option("out", {
    alias: "o",
    type: "string",
    describe: "output file",
  })
  .showHelpOnFail(true)
  .help()
  .strict()
  .strictCommands()
  .strictOptions();

export type Args = {
  path: string;
  out: string;
};

function _sanitizeAndFilter(
  len: number,
  value: string[]
): string[] | undefined {
  const result = value.map((value1) => value1.replace("Invalid DateTime", ""));
  if (result.length !== len + 1) {
    return undefined;
  }
  const badColumns = [5, 6];
  result[badColumns[0]] = `${result[badColumns[0]]}${result[badColumns[1]]}`;
  result.splice(badColumns[1], 1);
  return result;
}

async function sanitize(args: Args) {
  console.log(`Sanitize ${JSON.stringify(args)}`);
  const buf = await fs.readFile(args.path);
  const str = buf.toString();
  const lines = str.split("\r\n");
  const arrs = lines.map((value) => value.split(","));
  const [header, ...content] = arrs;
  const sanitized = [
    header,
    ..._.compact(
      content.map((value) => _sanitizeAndFilter(header.length, value))
    ),
  ];
  const result = sanitized.map((value) => value.join(",")).join("\r\n");
  await fs.writeFile(args.out, result);
  console.log(sanitized);
}

const { argv } = args.command(
  "$0 <path>",
  "Sanitize a bank statement",
  noop as any,
  sanitize as any
);
