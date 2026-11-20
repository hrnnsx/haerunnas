
import type { Terminal as XTerm } from "@xterm/xterm";

import type { FileSystemNode } from "../filesystem/types";
import { HOME_PATH } from "../filesystem/data";
import {
  getNodeByPath,
  resolvePath,
} from "../filesystem/utils";

interface CommandContext {
  terminal: XTerm;
  currentDirectory: string;
  onDirectoryChange: (path: string) => void;
  onOpenApplication?: (node: FileSystemNode) => void;
}

interface CommandDefinition {
  name: string;
  description: string;
  aliases?: string[];
  execute: (
    args: string[],
    context: CommandContext
  ) => void;
}

const COLORS = {
  gray: "\x1b[90m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};

// Add new commands here.
const commands: CommandDefinition[] = [
  {
    name: "help",
    description: "Show available commands",

    execute: (_, { terminal }) => {
      terminal.writeln("");
      terminal.writeln("Available commands:");
      terminal.writeln("");

      commands.forEach(({ name, description, aliases }) => {
        const aliasText = aliases?.length
          ? ` (${aliases.join(", ")})`
          : "";

        terminal.writeln(
          `  ${COLORS.green}${name.padEnd(12)}${COLORS.reset} ${description}${COLORS.gray}${aliasText}${COLORS.reset}`
        );
      });

      terminal.writeln("");
    },
  },

  {
    name: "clear",
    description: "Clear terminal",
    aliases: ["cls"],

    execute: (_, { terminal }) => {
      terminal.clear();
    },
  },

  {
    name: "pwd",
    description: "Print current directory",

    execute: (_, { terminal, currentDirectory }) => {
      terminal.writeln(currentDirectory);
    },
  },

  {
    name: "whoami",
    description: "Show current user",

    execute: (_, { terminal }) => {
      terminal.writeln("haerunnas");
    },
  },

  {
    name: "echo",
    description: "Print text",

    execute: (args, { terminal }) => {
      terminal.writeln(args.join(" "));
    },
  },

  {
    name: "ls",
    description: "List directory contents",

    execute: (args, { terminal, currentDirectory }) => {
      const targetPath = resolvePath(
        args[0] ?? ".",
        currentDirectory
      );

      const node = getNodeByPath(targetPath);

      if (!node) {
        terminal.writeln(
          `${COLORS.red}ls: cannot access '${args[0] ?? "."}': No such directory${COLORS.reset}`
        );
        return;
      }

      if (node.type !== "directory") {
        terminal.writeln(
          `${COLORS.red}ls: '${node.name}' is not a directory${COLORS.reset}`
        );
        return;
      }

      if (!node.children?.length) {
        terminal.writeln(
          `${COLORS.gray}Directory is empty.${COLORS.reset}`
        );
        return;
      }

      terminal.writeln("");

      node.children.forEach((child) => {
        const color =
          child.type === "directory"
            ? COLORS.blue
            : child.type === "application"
              ? COLORS.green
              : COLORS.reset;

        const suffix =
          child.type === "directory" ? "/" : "";

        terminal.writeln(
          `  ${color}${child.name}${suffix}${COLORS.reset}`
        );
      });

      terminal.writeln("");
    },
  },

  {
    name: "cd",
    description: "Change current directory",

    execute: (args, context) => {
      const { terminal, currentDirectory, onDirectoryChange } =
        context;

      const targetPath = resolvePath(
        args[0] ?? HOME_PATH,
        currentDirectory
      );

      const node = getNodeByPath(targetPath);

      if (!node) {
        terminal.writeln(
          `${COLORS.red}cd: no such directory: ${args[0] ?? "~"}${COLORS.reset}`
        );
        return;
      }

      if (node.type !== "directory") {
        terminal.writeln(
          `${COLORS.red}cd: not a directory: ${node.name}${COLORS.reset}`
        );
        return;
      }

      onDirectoryChange(node.path);
    },
  },

  {
    name: "open",
    description: "Open an application",

    execute: (args, context) => {
      const { terminal, currentDirectory, onOpenApplication } =
        context;

      if (!args.length) {
        terminal.writeln(
          `${COLORS.gray}Usage: open <application>${COLORS.reset}`
        );
        return;
      }

      const targetPath = resolvePath(
        args.join(" "),
        currentDirectory
      );

      const node = getNodeByPath(targetPath);

      if (!node) {
        terminal.writeln(
          `${COLORS.red}open: application not found: ${args.join(" ")}${COLORS.reset}`
        );
        return;
      }

      if (node.type !== "application") {
        terminal.writeln(
          `${COLORS.red}open: '${node.name}' is not an application${COLORS.reset}`
        );
        return;
      }

      if (!node.workspaceId) {
        terminal.writeln(
          `${COLORS.red}open: application has no workspace configured${COLORS.reset}`
        );
        return;
      }

      if (!onOpenApplication) {
        terminal.writeln(
          `${COLORS.gray}Application launcher is not connected yet.${COLORS.reset}`
        );
        return;
      }

      onOpenApplication(node);
    },
  },

  {
    name: "neofetch",
    description: "Show system information",
    aliases: ["ff"],

    execute: (_, { terminal }) => {
      terminal.writeln("");
      terminal.writeln(
        `${COLORS.green}       /\\          haerunnas@haerunnas-os${COLORS.reset}`
      );
      terminal.writeln(
        `${COLORS.green}      /  \\         ${COLORS.reset}-----------------------`
      );
      terminal.writeln(
        `${COLORS.green}     / /\\ \\        ${COLORS.reset}OS: Haerunnas OS`
      );
      terminal.writeln(
        `${COLORS.green}    / ____ \\       ${COLORS.reset}Shell: Haerunnas Shell`
      );
      terminal.writeln(
        `${COLORS.green}   /_/    \\_\\      ${COLORS.reset}Version: 1.0.0`
      );
      terminal.writeln("");
    },
  },
];

// Parse quoted and unquoted arguments.
function parseInput(input: string): string[] {
  const matches = input.match(/"([^"]*)"|'([^']*)'|(\S+)/g);

  return (
    matches?.map((value) =>
      value.replace(/^["']|["']$/g, "")
    ) ?? []
  );
}

// Execute a command.
export function executeCommand(
  input: string,
  context: CommandContext
): void {
  const [name, ...args] = parseInput(input.trim());

  if (!name) return;

  const normalizedName = name.toLowerCase();

  const command = commands.find(
    (item) =>
      item.name === normalizedName ||
      item.aliases?.includes(normalizedName)
  );

  if (!command) {
    context.terminal.writeln(
      `${COLORS.red}Command not found: ${name}${COLORS.reset}`
    );
    context.terminal.writeln(
      `${COLORS.gray}Type 'help' to see available commands.${COLORS.reset}`
    );
    return;
  }

  command.execute(args, context);
}
