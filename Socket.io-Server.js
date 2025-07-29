const blessed = require("blessed");
const {Server} = require("socket.io");
const http = require('http')
const server = http.createServer();
server.listen(3000, "0.0.0.0");
const io = new Server({cors: {origin: "*", methods: ["GET", "POST"]}});
const connectedClients = new Map();
const screen = blessed.screen({smartCSR: true, title: "Socket.io Server Dashboard"});

const serverLogsBox = blessed.box(
{
    top: "0%",
    left: "0%",
    width: "50%",
    height: "100%",
    label: "Server Logs",
    border: {type: "line"},
    style: {border: {fg: "cyan"}},
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {style: {bg: "blue"}}
});

const interactionBox = blessed.box(
{
    top: "50%",
    left: "50%",
    width: "50%",
    height: "50%",
    label: "User Interaction",
    border: {type: "line"},
    style: {border: {fg: "green"}}
});

const clientsBox = blessed.box(
{
    top: "0%",
    left: "50%",
    width: "50%",
    height: "50%",
    label: "Connected Clients",
    border: {type: "line"},
    style: {border: {fg: "yellow"}},
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {style: {bg: "blue"}}
});

const messageBoxSettings =
{
    parent: interactionBox,
    top: "center",
    left: "center",
    width: "80%",
    height: "shrink",
    label: "Insert your message:",
    border: {type: "line"},
    style: {border: {fg: "yellow"}}
}

screen.append(serverLogsBox);
screen.append(interactionBox);
screen.append(clientsBox);
screen.render();

const logMessage = (message) =>
{
    serverLogsBox.pushLine(message);
    serverLogsBox.scrollTo(serverLogsBox.getScrollHeight());
    screen.render();
    interactionBox.focus();
};

const updateClientsList = () =>
{
    const clients = Array.from(connectedClients.values());
    clientsBox.setContent(clients.map((client) => `Username: ${client.username}, ID: ${client.id}`).join("\n"));
    clientsBox.scrollTo(clientsBox.getScrollHeight());
    screen.render();
    interactionBox.focus();
};

io.on("connection", (socket) =>
{
    const username = `User${connectedClients.size + 1}`;
    connectedClients.set(socket.id, {id: socket.id, username});

    logMessage(`Client connected! ID: ${socket.id}, Username: ${username}`);
    updateClientsList();

    socket.on("message", (message) => {logMessage(`Message from ${username}: ${message}`);});
    socket.on("disconnect", () =>
    {
        logMessage(`Client disconnected: ${socket.id}`);
        connectedClients.delete(socket.id);
        updateClientsList();
    });
});

const sendMessage = () =>
{
    interactionBox.setContent("Send message to:\n0 - All clients\n1 - Specific client");
    screen.render();
    screen.once("keypress", (ch) =>
    {
        switch (ch)
        {
            case "0":
                const messageInput = blessed.textbox(messageBoxSettings);
                interactionBox.setContent("");
                screen.render();
                messageInput.focus();
                messageInput.readInput((err, message) =>
                {
                    if (message.trim())
                    {
                        io.sockets.emit("message", message.trim());
                        logMessage(`Message sent to all clients: ${message.trim()}`);
                    }
                    else logMessage("ERROR: Message cannot be empty!");
                    messageInput.destroy();
                    screen.render();
                    setTimeout(mainMenu, 100);
                });
                break;
            case "1":
                const clientList = Array.from(connectedClients.values())
                    .map((client, index) => `${index} - Username: ${client.username}, ID: ${client.id}`).join("\n");

                interactionBox.setContent(`Clients:\n${clientList}\n\nSelect client by index: `);
                screen.render();
                screen.once("keypress", (clientKey) =>
                {
                    const clientIndex = parseInt(clientKey, 10);
                    const targetClient = Array.from(connectedClients.values())[clientIndex];

                    if (targetClient)
                    {
                        const messageInput2 = blessed.textbox(messageBoxSettings);
                        interactionBox.setContent("");
                        screen.render();
                        messageInput2.focus();
                        messageInput2.readInput((err, message) =>
                        {
                            if (message.trim())
                            {
                                io.to(targetClient.id).emit("message", message.trim());
                                logMessage(`Message sent to ${targetClient.username}: ${message.trim()}`);
                            }
                            else logMessage("ERROR: Message cannot be empty!");
                            messageInput2.destroy();
                            screen.render();
                            setTimeout(mainMenu, 100); 
                        });
                    }
                    else
                    {
                        logMessage("ERROR: Invalid client selection.");
                        screen.render();
                        setTimeout(mainMenu, 100);
                    }
                });
                break;
            default:
                logMessage("ERROR: Invalid option.");
                setTimeout(mainMenu, 100);
        }
    });
};

const mainMenu = () =>
{
    interactionBox.setContent("Main Menu:\n0 - Send message\n1 - Close server");
    screen.render();
    screen.removeAllListeners("keypress");

    screen.once("keypress", (ch) =>
    {
        switch (ch)
        {
            case "0":
                sendMessage();
                break;
            case "1":
                io.close();
                process.exit();
            default:
                logMessage("ERROR: Invalid option.");
                mainMenu();
        }
    });
};

mainMenu();
io.listen(server, logMessage("Server running on port 3000!"));