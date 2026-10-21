// ===============================
// TECHCARE CUSTOMER SUPPORT BOT
// ===============================

let currentFlow = null;

let customer = {
    name: "",
    email: "",
    orderId: ""
};

// ===============================
// ELEMENTS
// ===============================

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");

console.log("Chatbot loaded");
console.log("Input:", userInput);
console.log("Send button:", sendButton);


// ===============================
// ADD MESSAGE
// ===============================

function addMessage(message, sender = "bot") {

    const messageDiv = document.createElement("div");

    messageDiv.classList.add("message");
    messageDiv.classList.add(sender);

    messageDiv.innerHTML = message;

    chatBox.appendChild(messageDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
}


// ===============================
// TYPING INDICATOR
// ===============================

function showTyping() {

    const typing = document.createElement("div");

    typing.id = "typing";
    typing.className = "message bot";
    typing.textContent = "Typing...";

    chatBox.appendChild(typing);

    chatBox.scrollTop = chatBox.scrollHeight;
}


function removeTyping() {

    const typing =
        document.getElementById("typing");

    if (typing) {
        typing.remove();
    }
}


// ===============================
// SAVE REQUEST TO BACKEND
// ===============================

async function saveRequest(type, data = {}) {

    try {

        const response = await fetch(
            "/api/request",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    type: type,

                    name:
                        customer.name || "",

                    email:
                        customer.email || "",

                    orderId:
                        customer.orderId || "",

                    ...data

                })
            }
        );


        const result =
            await response.json();


        console.log(
            "Request saved:",
            result
        );


        // ===============================
        // SHOW TICKET NUMBER
        // ===============================

        if (
            result.success &&
            result.request &&
            result.request.ticketId
        ) {

            addMessage(

                `🎫 <strong>Your Ticket ID is ${result.request.ticketId}</strong><br><br>` +

                `Please keep this ticket number for future tracking.`

            );

        }

    }

    catch (error) {

        console.error(
            "Could not save request:",
            error
        );

        addMessage(
            "⚠️ Your request could not be saved. Please try again."
        );

    }

}


// ===============================
// EMAIL VALIDATION
// ===============================

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );

}


// ===============================
// ORDER ID VALIDATION
// ===============================

function isValidOrderId(orderId) {

    return /^ORD\d{5,}$/i.test(
        orderId
    );

}


// ===============================
// TICKET ID VALIDATION
// ===============================

function isValidTicketId(ticketId) {

    return /^TCK-\d{5}$/i.test(
        ticketId
    );

}


// ===============================
// TRACK TICKET
// ===============================

async function trackTicket(ticketId) {

    const cleanTicketId =
        ticketId
            .trim()
            .toUpperCase();


    if (!isValidTicketId(cleanTicketId)) {

        addMessage(

            "❌ Please enter a valid ticket number.<br><br>" +
            "Example: <strong>TCK-00001</strong>"

        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/requests"
            );


        const requests =
            await response.json();


        const request =
            requests.find(

                item =>
                    (
                        item.ticketId || ""
                    ).toUpperCase() ===
                    cleanTicketId

            );


        if (!request) {

            addMessage(

                `❌ I couldn't find a ticket with number <strong>${cleanTicketId}</strong>.<br><br>` +
                "Please check the ticket number and try again."

            );

            return;

        }


        const customerName =
            request.name ||
            "Customer";


        const orderId =
            request.orderId ||
            "Not applicable";


        const requestType =
            formatRequestType(
                request.type
            );


        const status =
            request.status ||
            "Pending";


        addMessage(

            `🎫 <strong>Ticket ${request.ticketId}</strong><br><br>` +

            `👤 Customer: <strong>${customerName}</strong><br>` +

            `📧 Email: ${request.email || "-"}<br>` +

            `📋 Request: <strong>${requestType}</strong><br>` +

            `📦 Order ID: ${orderId}<br>` +

            `📌 Status: <strong>${status}</strong>`

        );

    }

    catch (error) {

        console.error(
            "Ticket tracking error:",
            error
        );


        addMessage(

            "❌ Sorry, I couldn't check your ticket right now. Please try again."

        );

    }

}


// ===============================
// FORMAT REQUEST TYPE
// ===============================

function formatRequestType(type) {

    const types = {

        refund: "Refund",

        return: "Return",

        cancel_order: "Cancel Order",

        order_status: "Order Status",

        human_support: "Human Support",

        payment: "Payment",

        general: "General"

    };


    return types[type] ||
        type ||
        "General";

}


// ===============================
// START CUSTOMER COLLECTION
// ===============================

function startCustomerCollection(type) {

    currentFlow = {

        type: type,

        step: "name"

    };


    customer = {

        name: "",

        email: "",

        orderId: ""

    };


    addMessage(
        "Sure! First, may I know your name?"
    );

}


// ===============================
// CUSTOMER NAME
// ===============================

function handleCustomerName(message) {

    const name =
        message.trim();


    if (name.length < 2) {

        addMessage(
            "Please enter a valid name."
        );

        return;

    }


    customer.name =
        name;


    currentFlow.step =
        "email";


    addMessage(

        `Nice to meet you, <strong>${customer.name}</strong>!`

    );


    setTimeout(
        function() {

            addMessage(
                "Please enter your email address."
            );

        },
        500
    );

}


// ===============================
// CUSTOMER EMAIL
// ===============================

function handleCustomerEmail(message) {

    const email =
        message.trim();


    if (!isValidEmail(email)) {

        addMessage(

            "❌ Please enter a valid email address.<br><br>" +
            "Example: name@example.com"

        );

        return;

    }


    customer.email =
        email;


    if (

        currentFlow.type === "refund" ||

        currentFlow.type === "return" ||

        currentFlow.type === "cancel_order" ||

        currentFlow.type === "order_status"

    ) {

        currentFlow.step =
            "orderId";


        addMessage(

            "Thanks! Now please enter your Order ID.<br><br>" +
            "Example: <strong>ORD56789</strong>"

        );

    }

    else {

        finishRequest();

    }

}


// ===============================
// ORDER ID
// ===============================

function handleOrderId(message) {

    const orderId =
        message
            .trim()
            .toUpperCase();


    if (!isValidOrderId(orderId)) {

        addMessage(

            "❌ Please enter a valid Order ID.<br><br>" +
            "Example: <strong>ORD56789</strong>"

        );

        return;

    }


    customer.orderId =
        orderId;


    finishRequest();

}


// ===============================
// FINISH REQUEST
// ===============================

function finishRequest() {

    const type =
        currentFlow.type;


    if (type === "refund") {

        addMessage(

            `✅ Thanks ${customer.name}! Your refund request for Order ID <strong>${customer.orderId}</strong> has been recorded.`

        );


        saveRequest("refund");

    }


    else if (type === "return") {

        addMessage(

            `✅ Thanks ${customer.name}! Your return request for Order ID <strong>${customer.orderId}</strong> has been recorded.`

        );


        saveRequest("return");

    }


    else if (type === "cancel_order") {

        addMessage(

            `✅ Thanks ${customer.name}! Your cancellation request for Order ID <strong>${customer.orderId}</strong> has been recorded.`

        );


        saveRequest("cancel_order");

    }


    else if (type === "order_status") {

        addMessage(

            `📦 Thanks ${customer.name}! Order <strong>${customer.orderId}</strong> is currently <strong>In Transit</strong>.`

        );


        saveRequest("order_status");

    }


    else if (type === "human_support") {

        addMessage(

            `✅ Thanks ${customer.name}! Your support request has been recorded. Our support team will contact you at <strong>${customer.email}</strong>.`

        );


        saveRequest("human_support");

    }


    else {

        addMessage(

            "✅ Your request has been recorded successfully."

        );


        saveRequest(type);

    }


    currentFlow = null;

}


// ===============================
// HANDLE MESSAGE
// ===============================

async function handleMessage(message) {

    message =
        message.trim();


    if (!message) {
        return;
    }


    addMessage(
        message,
        "user"
    );


    showTyping();


    await new Promise(
        function(resolve) {

            setTimeout(
                resolve,
                400
            );

        }
    );


    removeTyping();


    // ===========================
    // ACTIVE CUSTOMER FLOW
    // ===========================

    if (currentFlow) {

        if (
            currentFlow.step ===
            "name"
        ) {

            handleCustomerName(
                message
            );

            return;

        }


        if (
            currentFlow.step ===
            "email"
        ) {

            handleCustomerEmail(
                message
            );

            return;

        }


        if (
            currentFlow.step ===
            "orderId"
        ) {

            handleOrderId(
                message
            );

            return;

        }

    }


    const text =
        message.toLowerCase();


    // ===========================
    // TRACK TICKET
    // ===========================

    if (

        text.includes("track ticket") ||

        text.includes("ticket status") ||

        text.includes("check ticket") ||

        text.includes("track my ticket") ||

        text.includes("ticket")

    ) {

        currentFlow = {

            type: "track_ticket",

            step: "ticketId"

        };


        addMessage(

            "Sure! 🎫 Please enter your ticket number.<br><br>" +
            "Example: <strong>TCK-00001</strong>"

        );


        return;

    }


    // ===========================
    // TRACK TICKET INPUT
    // ===========================

    if (
        isValidTicketId(
            message
        )
    ) {

        await trackTicket(
            message
        );

        return;

    }


    // ===========================
    // REFUND
    // ===========================

    if (
        text.includes("refund")
    ) {

        startCustomerCollection(
            "refund"
        );

        return;

    }


    // ===========================
    // RETURN
    // ===========================

    if (
        text.includes("return")
    ) {

        startCustomerCollection(
            "return"
        );

        return;

    }


    // ===========================
    // CANCEL ORDER
    // ===========================

    if (

        text.includes("cancel") ||

        text.includes("cancellation")

    ) {

        startCustomerCollection(
            "cancel_order"
        );

        return;

    }


    // ===========================
    // ORDER STATUS
    // ===========================

    if (

        text.includes("order") ||

        text.includes("track")

    ) {

        startCustomerCollection(
            "order_status"
        );

        return;

    }


    // ===========================
    // HUMAN SUPPORT
    // ===========================

    if (

        text.includes("human") ||

        text.includes("agent") ||

        text.includes("support")

    ) {

        startCustomerCollection(
            "human_support"
        );

        return;

    }


    // ===========================
    // PAYMENT
    // ===========================

    if (
        text.includes("payment")
    ) {

        addMessage(

            "Please describe your payment issue and our support team will assist you."

        );

        return;

    }


    // ===========================
    // GREETING
    // ===========================

    if (

        text === "hi" ||

        text === "hello" ||

        text === "hey" ||

        text.startsWith("hi ") ||

        text.startsWith("hello ")

    ) {

        addMessage(

            "Hi! 👋 Welcome to TechCare Support. How can I help you today?"

        );

        return;

    }


    // ===========================
    // DEFAULT
    // ===========================

    addMessage(

        "I can help with orders, refunds, returns, cancellations, payments, ticket tracking, or connecting you with a support agent."

    );

}


// ===============================
// SEND MESSAGE
// ===============================

function sendMessage() {

    const message =
        userInput.value.trim();


    if (!message) {
        return;
    }


    userInput.value = "";


    handleMessage(
        message
    );

}


// ===============================
// SEND BUTTON
// ===============================

if (sendButton) {

    sendButton.addEventListener(

        "click",

        function(event) {

            event.preventDefault();

            sendMessage();

        }

    );

}


// ===============================
// ENTER KEY
// ===============================

if (userInput) {

    userInput.addEventListener(

        "keydown",

        function(event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                sendMessage();

            }

        }

    );

}


// ===============================
// QUICK BUTTONS
// ===============================

document
    .querySelectorAll(
        ".quick-btn"
    )
    .forEach(
        function(button) {

            button.addEventListener(

                "click",

                function(event) {

                    event.preventDefault();


                    const message =
                        this.textContent.trim();


                    handleMessage(
                        message
                    );

                }

            );

        }
    );
