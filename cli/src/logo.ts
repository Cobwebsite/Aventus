const logo = [
     '     /\\                     | |             ',
     '    /  \\ __   __ ___  _ __  | |_  _   _  ___ ',
     "   / /\\ \\\\ \\ / // _ \\|  _ \\ | __|| | | |/ __|",
     '  / ____ \\\\ V /|  __/| | | || |_ | |_| |\\__ \\',
     ' /_/    \\_\\\\_/  \\___||_| |_| \\__| \\____||___/'
]

export function printLogo() {
     console.log("\x1b[31m")
     console.log(logo.join("\r\n"));
     console.log('\x1b[0m')
}