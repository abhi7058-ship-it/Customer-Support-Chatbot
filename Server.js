const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const dataFolder = path.join(__dirname, "data");
const dataFile = path.join(dataFolder, "requests.json");


// ===============================
// CREATE DATA FOLDER / FILE
// ===============================

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
}

if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, "[]");
}


// ===============================
// GET REQUESTS FROM FILE
// ===============================

function getRequests() {

    try {

        const data =
            fs.readFileSync(
                dataFile,
                "utf8"
            );

        return JSON.parse(data);

    } catch (error) {

        console.error(
            "Error reading requests:",
            error
        );

        return [];

    }

}


// ===============================
// SAVE REQUESTS TO FILE
// ===============================

function saveRequests(requests) {

    fs.writeFileSync(

        dataFile,

        JSON.stringify(
            requests,
            null,
            2
        )

    );

}


// ===============================
// FIX OLD REQUESTS
// ===============================

function migrateRequests() {

    const requests =
        getRequests();

    let changed = false;


    requests.forEach(
        (request, index) => {

            // Add ticket ID if missing

            if (!request.ticketId) {

                request.ticketId =
                    `TCK-${String(
                        index + 1
                    ).padStart(5, "0")}`;

                changed = true;

            }


            // Add status if missing

            if (!request.status) {

                request.status =
                    "Pending";

                changed = true;

            }


            // Make sure name exists

            if (
                request.name === undefined ||
                request.name === null
            ) {

                request.name = "";

                changed = true;

            }

        }
    );


    if (changed) {

        saveRequests(
            requests
        );

        console.log(
            "Old requests updated successfully."
        );

    }

}


// Run migration when server starts

migrateRequests();


// ===============================
// MIDDLEWARE
// ===============================

app.use(
    express.json()
);

app.use(
    express.static(__dirname)
);


// ===============================
// TEST API
// ===============================

app.get(
    "/api/test",
    (req, res) => {

        res.json({

            success: true,

            message:
                "TechCare backend is working!"

        });

    }
);


// ===============================
// GET ALL REQUESTS
// ===============================

app.get(
    "/api/requests",
    (req, res) => {

        try {

            const requests =
                getRequests();

            res.json(
                requests
            );

        } catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Could not load requests."

            });

        }

    }
);


// ===============================
// CREATE NEW REQUEST
// ===============================

app.post(
    "/api/request",
    (req, res) => {

        try {

            const requests =
                getRequests();


            // Generate next ticket number

            let highestTicketNumber = 0;


            requests.forEach(
                request => {

                    if (
                        request.ticketId
                    ) {

                        const number =
                            parseInt(
                                request.ticketId
                                    .replace(
                                        "TCK-",
                                        ""
                                    ),
                                10
                            );


                        if (
                            !isNaN(number) &&
                            number >
                                highestTicketNumber
                        ) {

                            highestTicketNumber =
                                number;

                        }

                    }

                }
            );


            const nextTicketNumber =
                highestTicketNumber + 1;


            const ticketId =
                `TCK-${String(
                    nextTicketNumber
                ).padStart(5, "0")}`;


            const newRequest = {

                id:
                    Date.now(),

                ticketId:
                    ticketId,

                type:
                    req.body.type ||
                    "general",

                name:
                    req.body.name ||
                    "",

                email:
                    req.body.email ||
                    "",

                orderId:
                    req.body.orderId ||
                    "",

                status:
                    "Pending",

                createdAt:
                    new Date().toISOString()

            };


            requests.push(
                newRequest
            );


            saveRequests(
                requests
            );


            res.json({

                success: true,

                message:
                    "Request saved successfully.",

                request:
                    newRequest

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Could not save request."

            });

        }

    }
);


// ===============================
// UPDATE REQUEST STATUS
// ===============================

app.put(
    "/api/request/:id",
    (req, res) => {

        try {

            const requestId =
                Number(
                    req.params.id
                );

            const newStatus =
                req.body.status;


            const allowedStatuses = [

                "Pending",

                "In Progress",

                "Resolved"

            ];


            if (
                !allowedStatuses.includes(
                    newStatus
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid status."

                });

            }


            const requests =
                getRequests();


            const request =
                requests.find(

                    item =>
                        Number(item.id) ===
                        requestId

                );


            if (!request) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Request not found."

                });

            }


            request.status =
                newStatus;


            saveRequests(
                requests
            );


            res.json({

                success: true,

                message:
                    "Status updated successfully.",

                request:
                    request

            });

        }

        catch (error) {

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Server error while updating status."

            });

        }

    }
);


// ===============================
// START SERVER
// ===============================

app.listen(
    PORT,
    () => {

        console.log(
            `TechCare chatbot running at http://localhost:${PORT}`
        );

    }
);
