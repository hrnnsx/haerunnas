export function executeCommand(command: string): string {
  const [cmd] = command.trim().toLowerCase().split(" ");

  switch (cmd) {
    case "help":
      return [
        "Available commands:",
        "",
        "  help       Show available commands",
        "  about      About me",
        "  projects   View my projects",
        "  skills     View my technical skills",
        "  contact    Get in touch",
        "  clear      Clear terminal",
        "  ff         System information",
        "",
      ].join("\r\n");

    case "about":
      return [
        "Hi, I'm Haerunnas.",
        "Backend-focused Computer Science student.",
        "Interested in APIs, databases, and backend systems.",
        "",
      ].join("\r\n");

    case "projects":
      return "Projects will be available soon.\r\n";

    case "skills":
      return "Go | Node.js | PostgreSQL | MySQL\r\n";

    case "contact":
      return "Email: nassjourney@gmail.com\r\n";

    case "ff":
      return [
        "                                ",        
        "                    █           ",
        "                   █            ",
        "       █ ███      █             ",
        "     ███████████                ",
        "     ████████████               ",
        "    ██████ ███████              ",
        "    ██████████████              ",
        "    █████ ██   ███              ",
        "    █ ███        █              ",
        "       ██       █               ",
        "      ███       █               ",
        "     ████  █  █ █               ",
        "    ██████  ███  █              ",
        "    ██████  ███  ██             ",
        "    ██████  ███  ██             ",
        "    ███████████  ██             ",
        "",
      ].join("\r\n");

    default:
      return cmd
        ? `Command not found: ${cmd}. Type 'help' for available commands.\r\n`
        : "";
  }
}