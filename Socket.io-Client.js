const {io} = require("socket.io-client");
const blessed = require("blessed");
const screen = blessed.screen({smartCSR: true, title: "Chat Application"});
const serverBox = blessed.box(
{
    top: "0%",
    left: "0%",
    width: "50%",
    height: "100%",
    label: "Server Messages",
    border: {type: "line"},
    style: {border: {fg: "cyan"}},
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {style: {bg: "blue"}}
});

const menuBox = blessed.box(
{
    top: "0%",
    left: "50%",
    width: "50%",
    height: "100%",
    label: "Main Menu",
    border: {type: "line"},
    style: {border: {fg: "green"}}
});
let socket, serverAddress, serverPort;

screen.append(serverBox);
screen.append(menuBox);
screen.render();

const displayLogs = (log) =>
{
    serverBox.pushLine(log);
    serverBox.scrollTo(serverBox.getScrollHeight());
    screen.render();
    menuBox.focus();
};

const connectToServer = () =>
{
    const url = `http://${serverAddress}:${serverPort}`;
    socket = io(url);
    socket.on("connect", () =>
    {
        displayLogs(`Connected to server at ${url}!`);
        mainMenu();
    });
    socket.on("message", (message) => {displayLogs(`Message from server: ${message}`);});
    socket.on("connect_error", () =>
    {
        displayLogs("ERROR: Failed to connect to the server. Check address and port.");
        socket.close();
        socket = null;
        setTimeout(loginScreen, 100);
    });
    socket.on("disconnect", () =>
    {
        displayLogs("Disconnected from server! Please reconnect to send messages.");
        screen.removeAllListeners("keypress");
        setTimeout(loginScreen, 100);
    });
};

const sendMessage = () =>
{
    if (!socket.connected)
    {
        displayLogs("ERROR: Not connected to the server. Unable to send messages.");
        setTimeout(mainMenu, 100);
        return;
    }

    menuBox.setContent("");
    const messageBox = blessed.textbox(
    {
        parent: menuBox,
        top: "center",
        left: "center",
        width: "80%",
        height: "shrink",
        label: "Insert your message:",
        border: {type: "line"},
        style: {border: {fg: "yellow"}}
    });

    screen.removeAllListeners("keypress");
    messageBox.focus();
    messageBox.readInput((err, message) =>
    {
        if (message.trim())
        {
            socket.emit("message", message.trim());
            displayLogs(`Sent message to server: ${message.trim()}`);
        }
        else displayLogs("ERROR: Message cannot be empty!");
        messageBox.destroy();
        setTimeout(mainMenu, 100);
    });
    screen.render();
};

const mainMenu = () =>
{
    menuBox.setContent('Want to send a message or close the client?\n0 = Send Message\n1 = Close Client');
    screen.render();
    screen.removeAllListeners("keypress");

    screen.on("keypress", (ch) =>
    {
        switch (ch)
        {
            case "0":
                sendMessage();
                break;
            case "1":
                socket.close();
                process.exit();
            default:
                displayLogs("ERROR: Select a valid option!");
                break;
        }
    });
};

const loginScreen = () =>
{
    menuBox.setContent("");
    const serverAddressBox = blessed.textbox(
    {
        parent: menuBox,
        top: "center",
        left: "center",
        width: "50%",
        height: "shrink",
        label: "Server Address:",
        border: {type: "line"},
        style: {border: {fg: "yellow" }}
    });

    screen.removeAllListeners("keypress");
    serverAddressBox.focus();
    serverAddressBox.key("escape", () =>
    {
        serverAddressBox.destroy();
        process.exit(0);
    });

    serverAddressBox.readInput((err, address) =>
    {
        if (!address || !address.trim())
        {
            serverAddressBox.destroy();
            displayLogs("ERROR: Server address cannot be empty.");
            return;
        }
        serverAddress = address.trim();
        const serverPortBox = blessed.textbox(
        {
            parent: menuBox,
            top: "center",
            left: "center",
            width: "50%",
            height: "shrink",
            label: "Server Port:",
            border: {type: "line"},
            style: {border: {fg: "yellow"}}
        });

        serverPortBox.focus();
        serverPortBox.key("escape", () =>
        {
            serverPortBox.destroy();
            process.exit(0);
        });

        serverPortBox.readInput((err, port) =>
        {
            serverAddressBox.destroy();
            if (!port || !port.trim())
            {
                serverPortBox.destroy();
                displayLogs("ERROR: Server port cannot be empty.");
                return;
            }
            serverPort = parseInt(port.trim(), 10);
            if (isNaN(serverPort))
            {
                serverPortBox.destroy();
                displayLogs("ERROR: Server port must be a valid number.");
                return;
            }
            serverPortBox.destroy();
            connectToServer();
        });
        screen.render();
    });
    screen.render();
};

loginScreen();