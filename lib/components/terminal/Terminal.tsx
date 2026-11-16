
"use client";

import { useEffect, useRef, useState } from "react";

import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

import "@xterm/xterm/css/xterm.css";
import "./terminal.css";

type TerminalStage = "welcome" | "closing" | "opening" | "system";

interface TerminalProps {
  onBootStart: () => void;
  onBootComplete: () => void;
  onCommand: (command: string) => void;
}

export default function Terminal({
  onBootStart,
  onBootComplete,
  onCommand,
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Keep callbacks updated without recreating the terminal.
  const bootStartCallback = useRef(onBootStart);
  const bootCallback = useRef(onBootComplete);
  const commandCallback = useRef(onCommand);

  const [stage, setStage] = useState<TerminalStage>("welcome");

  useEffect(() => {
    bootStartCallback.current = onBootStart;
    bootCallback.current = onBootComplete;
    commandCallback.current = onCommand;
  }, [onBootStart, onBootComplete, onCommand]);

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

    // ANSI colors
    const COLORS = {
      slate: "\x1b[38;2;100;116;139m",
      gray: "\x1b[90m",
      green: "\x1b[32m",
      cyan: "\x1b[36m",
      reset: "\x1b[0m",
    };

    let input = "";
    let systemStarted = false;
    let isBooting = false;
    let disposed = false;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Safe timeout helper
    const delay = (callback: () => void, duration: number) => {
      const timer = setTimeout(() => {
        if (!disposed) callback();
      }, duration);

      timers.push(timer);
    };

    // Shell prompt
    const prompt = (newLine = true) => {
      if (newLine) terminal.write("\r\n");

      terminal.write(
        `${COLORS.slate}haerunnas@system${COLORS.reset}:${COLORS.cyan}~${COLORS.reset}$ `
      );
    };

    // Boot sequence
    const bootSystem = () => {
      isBooting = true;

      terminal.writeln("");
      terminal.writeln(
        `${COLORS.gray}Initializing Haerunnas OS...${COLORS.reset}`
      );

      const messages = [
        "Loading system configuration...",
        "Initializing environment...",
        "Starting haerunnas-shell...",
        `${COLORS.green}System ready.${COLORS.reset}`,
      ];

      messages.forEach((message, index) => {
        delay(() => {
          terminal.writeln(message);

          // Last boot message
          if (index === messages.length - 1) {
            terminal.writeln("");
            terminal.writeln("Boot sequence completed.");

            // Start closing animation
            delay(() => {
              setStage("closing");

              // Wait until terminal is closed
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

                // Reveal main display
                bootCallback.current();

                // Start opening animation
                setStage("opening");

                delay(() => {
                  systemStarted = true;
                  isBooting = false;

                  setStage("system");
                }, 750);
              }, 750);
            }, 800);
          }
        }, (index + 1) * 500);
      });
    };

    // Initial terminal screen
    terminal.writeln(
      `${COLORS.gray}PRE-BOOT ENVIRONMENT${COLORS.reset}`
    );

    prompt(false);

    // Terminal input handler
    const inputHandler = terminal.onData((data) => {
      if (isBooting) return;

      // Enter
      if (data === "\r") {
        const command = input.trim();

        terminal.write("\r\n");
        input = "";

        // Before system initialization
        if (!systemStarted) {
          if (command.toLowerCase() === "enter") {
            bootStartCallback.current();
            bootSystem();
          } else {
            prompt(false);
          }

          return;
        }

        // After system initialization
        if (command) {
          commandCallback.current(command);
        }

        prompt(false);
        return;
      }

      // Backspace
      if (data === "\u007f") {
        if (input.length > 0) {
          input = input.slice(0, -1);
          terminal.write("\b \b");
        }

        return;
      }

      // Printable characters
      if (data >= " " && data <= "~") {
        input += data;
        terminal.write(data);
      }
    });

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (!disposed && terminalRef.current?.clientHeight) {
          fitAddon.fit();
        }
      });
    });

    resizeObserver.observe(terminalRef.current);

    requestAnimationFrame(() => {
      fitAddon.fit();
    });

    // Cleanup
    return () => {
      disposed = true;

      timers.forEach(clearTimeout);

      inputHandler.dispose();
      resizeObserver.disconnect();
      terminal.dispose();
    };
  }, []);

  return (
    <div
      className={`
        terminal-container z-20 overflow-hidden
        transition-all duration-700 ease-in-out

        ${
          stage === "welcome"
            ? "relative mx-auto w-[min(470px,calc(100vw-2rem))] h-40"
            : stage === "closing"
              ? "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(470px,calc(100vw-2rem))] h-0 opacity-0"
              : "fixed left-1/2 bottom-8 -translate-x-1/2 w-[min(900px,calc(100vw-2rem))] h-30 opacity-100"
        }
      `}
    >
      <div ref={terminalRef} className="terminal-body h-full backdrop-blur-md" />
    </div>
  );
}
