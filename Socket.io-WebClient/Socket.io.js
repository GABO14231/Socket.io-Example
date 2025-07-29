const loginScreen = document.querySelector(".loginScreen");
const appScreen = document.querySelector(".appScreen");
const serverAddressInput = document.querySelector(".serverAddressInput");
const serverPortInput = document.querySelector(".serverPortInput");
const connectButton = document.querySelector(".connectButton");
const loginStatus = document.querySelector(".loginStatus");
const sendMessageDiv = document.querySelector(".SendMessage");
const sendMessageButton = document.querySelector(".sendMessageButton");
const serverLogDiv = document.querySelector(".RecieveMessage");
const clearLogButton = document.querySelector(".clearLogButton");
const disconnectButton = document.querySelector(".disconnectButton");
const fields = [serverAddressInput, serverPortInput];
let socket;

const setupFieldValidation = (field) =>
{
    field.addEventListener("blur", () =>
    {
        if (!field.value) field.setCustomValidity("This field is required.");
        else if (field === serverPortInput && isNaN(field.value)) field.setCustomValidity("Please enter a number!");
        else field.setCustomValidity("");
        field.reportValidity();
    });
    field.addEventListener("input", () => {field.setCustomValidity("");});
};

const validateFields = (fields) =>
{
    let allValid = true;
    fields.forEach((field) =>
    {
        if (!field.value)
        {
            setupFieldValidation(field);
            allValid = false;
        }
        else field.setCustomValidity("");
    });
    return allValid;
};

validateFields(fields);

const showDialog = (message) =>
{
    const dialog = document.createElement("dialog");
    const messageParagraph = document.createElement("p");
    messageParagraph.textContent = message;
    const closeButton = document.createElement("button");
    closeButton.textContent = "OK";
    closeButton.addEventListener("click", () =>
    {
        dialog.close();
        dialog.remove();
    });
    dialog.appendChild(messageParagraph);
    dialog.appendChild(closeButton);
    document.body.appendChild(dialog);
    dialog.showModal();
};

connectButton.addEventListener("click", () =>
{
    if (!validateFields(fields))
    {
        loginStatus.textContent = "Please enter the required information.";
        return;
    }

    const address = serverAddressInput.value.trim();
    const port = serverPortInput.value.trim();
    const url = `http://${address}:${port}`;

    try
    {
        socket = io(url);
        loginStatus.textContent = "Connecting...";

        socket.on("connect", () =>
        {
            loginStatus.textContent = "";
            loginScreen.style.display = "none";
            appScreen.style.display = "block";
            console.log("Connected to server!");
        });

        socket.on("disconnect", () =>
        {
            console.error("Lost connection to server");
            loginScreen.style.display = "flex";
            appScreen.style.display = "none";
            showDialog("Lost connection to the server! Please reconnect to send messages.");
            socket.destroy();
        });

        socket.on("connect_error", () =>
        {
            loginStatus.textContent = "Failed to connect. Please try again.";
            console.error("Connection error.");
            socket.destroy();
        });

        socket.on("message", (message) =>
        {
            serverLogDiv.innerHTML += `${message}<br/>`;
            console.log(`Received message from server: ${message}`);
        });
    }
    catch (error)
    {
        loginStatus.textContent = "Invalid server address or port.";
        console.error("Connection failed:", error);
    }
});

sendMessageButton.addEventListener("click", () =>
{
    const message = sendMessageDiv.textContent.trim();
    if (message)
    {
        socket.emit("message", message);
        showDialog("Message sent successfully!");
        console.log(`Sent message to server: ${message}`);
        sendMessageDiv.textContent = "";
    }
    else showDialog("Message cannot be empty!");
});

clearLogButton.addEventListener("click", () => {serverLogDiv.innerHTML = "";});
disconnectButton.addEventListener("click", () =>
{
    socket.destroy();
    loginScreen.style.display = "flex";
    appScreen.style.display = "none";
    console.log("Disconnected from server.");
    showDialog("Disconnected from server!")
});