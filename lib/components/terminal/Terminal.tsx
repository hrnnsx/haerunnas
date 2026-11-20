"use client";

import { useEffect, useRef, useState } from "react";

import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

import { executeCommand } from "./command/command";
import type { FileSystemNode } from "./filesystem/types";

import "@xterm/xterm/css/xterm.css";
import "./terminal.css";

type TerminalStage = "welcome" | "closing" | "opening" | "system";

interface TerminalProps {
  onBootStart: () => void;
  onBootComplete: () => void;

  currentDirectory: string;
  onDirectoryChange: (path: string) => void;

  onOpenApplication?: (node: FileSystemNode) => void;
}

const HOME_DIRECTORY = "/home/haerunnas";

export default function Terminal({
  onBootStart,
  onBootComplete,
  currentDirectory,
  onDirectoryChange,
  onOpenApplication,
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Keep callbacks updated without recreating xterm.
  const bootStartCallback = useRef(onBootStart);
  const bootCallback = useRef(onBootComplete);
  const directoryChangeCallback = useRef(onDirectoryChange);
  const openApplicationCallback = useRef(onOpenApplication);
  const directoryRef = useRef(currentDirectory);

  const [stage, setStage] = useState<TerminalStage>("welcome");

  useEffect(() => {
    bootStartCallback.current = onBootStart;
    bootCallback.current = onBootComplete;
    directoryChangeCallback.current = onDirectoryChange;
    openApplicationCallback.current = onOpenApplication;
    directoryRef.current = currentDirectory;
  }, [
    onBootStart,
    onBootComplete,
    onDirectoryChange,
    onOpenApplication,
    currentDirectory,
  ]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new XTerm({
      cursorBlink: true,
      cursorStyle: "bar",
      fontFamily: "Geist Mono, monospace",
      fontSize: 14,
      lineHeight: 1.5,
      theme: {
        background: "#00000000",
        foreground: "#d4d4d4",
        cursor: "#ffffff",
        selectionBackground: "#ffffff33",
      },
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();

    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);

    const COLORS = {
      gray: "\x1b[90m",
      green: "\x1b[32m",
      blue: "\x1b[34m",
      reset: "\x1b[0m",
    };

    let input = "";
    let systemStarted = false;
    let isBooting = false;
    let disposed = false;

    const timers: ReturnType<typeof setTimeout>[] = [];

    const delay = (callback: () => void, duration: number) => {
      const timer = setTimeout(() => {
        if (!disposed) callback();
      }, duration);

      timers.push(timer);
    };

    // Shell prompt.
    const getPrompt = () => {
      const directory = directoryRef.current;

      const displayDirectory =
        directory === HOME_DIRECTORY
          ? "~"
          : directory.startsWith(`${HOME_DIRECTORY}/`)
            ? `~${directory.slice(HOME_DIRECTORY.length)}`
            : directory;

      return `\x1b[32mhaerunnas@haerunnas-os\x1b[0m:\x1b[34m${displayDirectory}\x1b[0m$ `;
    };

    const prompt = (newLine = true) => {
      if (newLine) terminal.write("\r\n");
      terminal.write(getPrompt());
    };

    // Execute shell command.
    const handleCommand = (command: string) => {
      try {
        executeCommand(command, {
          terminal,
          currentDirectory: directoryRef.current,

          onDirectoryChange: (path) => {
            directoryChangeCallback.current(path);
          },

          onOpenApplication: (node) => {
            openApplicationCallback.current?.(node);
          },
        });
      } catch (error) {
        console.error("Terminal command error:", error);

        terminal.writeln(
          `${COLORS.gray}An error occurred while executing the command.${COLORS.reset}`
        );
      }
    };

    // Boot sequence.
    const bootSystem = () => {
      isBooting = true;

      terminal.writeln("");
      terminal.writeln(
        `${COLORS.gray}Initializing OS...${COLORS.reset}`
      );

      const messages = [
        "Loading system configuration...",
        "Initializing environment...",
        "Starting System...",
        `${COLORS.green}System ready.${COLORS.reset}`,
      ];

      messages.forEach((message, index) => {
        delay(() => {
          terminal.writeln(message);

          if (index === messages.length - 1) {
            terminal.writeln("");
            terminal.writeln("Boot sequence completed.");

            delay(() => {
              setStage("closing");

              delay(() => {
                terminal.clear();

                terminal.writeln(
                  `${COLORS.green}OS INITIALIZED${COLORS.reset}`
                );

                terminal.writeln(
                  `${COLORS.gray}Personal environment / v1.0.0${COLORS.reset}`
                );

                terminal.writeln("");
                terminal.writeln("Welcome, I'm Haerunnas.");

                prompt(false);

                bootCallback.current();

                setStage("opening");

                delay(() => {
                  systemStarted = true;
                  isBooting = false;

                  setStage("system");

                  requestAnimationFrame(() => {
                    if (!disposed) fitAddon.fit();
                  });
                }, 750);
              }, 750);
            }, 800);
          }
        }, (index + 1) * 500);
      });
    };

    // Initial screen.
    terminal.writeln(
      `${COLORS.gray}PRE-BOOT ENVIRONMENT${COLORS.reset}`
    );

    terminal.writeln(
      `${COLORS.gray}Type "enter" to start boot.${COLORS.reset}`
    );

    prompt(false);

    // Keyboard input.
    const inputHandler = terminal.onData((data) => {
      if (isBooting) return;

      // Enter.
      if (data === "\r") {
        const command = input.trim();

        terminal.write("\r\n");
        input = "";

        if (!systemStarted) {
          if (command.toLowerCase() === "enter") {
            bootStartCallback.current();
            bootSystem();
          } else {
            prompt(false);
          }

          return;
        }

        if (command) {
          handleCommand(command);
        }

        prompt(false);
        return;
      }

      // Backspace.
      if (data === "\u007f") {
        if (input.length > 0) {
          input = input.slice(0, -1);
          terminal.write("\b \b");
        }

        return;
      }

      // Printable characters.
      if (data >= " " && data <= "~") {
        input += data;
        terminal.write(data);
      }
    });

    // Resize handling.
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (
          !disposed &&
          terminalRef.current?.clientHeight &&
          terminalRef.current.clientWidth
        ) {
          fitAddon.fit();
        }
      });
    });

    resizeObserver.observe(terminalRef.current);

    requestAnimationFrame(() => {
      if (!disposed) fitAddon.fit();
    });

    // Cleanup.
    return () => {
      disposed = true;

      timers.forEach(clearTimeout);

      inputHandler.dispose();
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, []);

  // Container styles based on terminal stage.
  const stageClasses: Record<TerminalStage, string> = {
    welcome: `
      relative h-full w-full
      opacity-100
    `,
    closing: `
      relative h-full w-full
      opacity-0
    `,
    opening: `
      relative h-full w-full
      opacity-0
    `,
    system: `
      relative h-full w-full
      opacity-100
    `,
  };

  
  return (
    <div
      className={`
        terminal-container
        z-20
        pointer-events-auto
        bg-black/75
        backdrop-blur-xl
        shadow-2xl
        transition-all duration-700 ease-in-out
        ${stageClasses[stage]}
      `}
    >
      <div
        ref={terminalRef}
        className="terminal-body h-full w-full"
      />
    </div>
  );

}
