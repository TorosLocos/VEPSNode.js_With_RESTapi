//--------------------------------     VEPS - BACKEND SERVER     ------------------------------------
const express = require('express');
const app = express();
const fs = require('fs');
const csv = require('csv-parser');
app.use(express.json());
app.use(express.static('public'));

//----------------------------------------     LOG     -----------------------------------------

//Log request to "/locations"
app.use('/users', function (req, res, next) {
    const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    console.log(`\nRequest received for '/users' endpoint at date & time [${timestamp}] `);
    console.log('Request Method:', req.method);
    console.log('Requested URL:', req.originalUrl);
    console.log('Request Body (if any):', req.body);
    console.log('Device Name:', req.headers['user-agent']);

    res.on('finish', () => {
        console.log(`Status code: ${res.statusCode}`);
    });

    next();
});

// Log request to "/locations"
app.use('/locations', function (req, res, next) {
    const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    console.log(`\nRequest received for '/locations' endpoint at date & time [${timestamp}] `);
    console.log('Request Method:', req.method);
    console.log('Requested URL:', req.originalUrl);
    console.log('Request Body (if any):', req.body);
    console.log('Device Name:', req.headers['user-agent']);
    
    res.on('finish', () => {
        console.log(`Status code: ${res.statusCode}`);
    });

    next();
});

// Log request to "/locations"
app.use('/reservations', function (req, res, next) {
    const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    console.log(`\nRequest received for '/reservations' endpoint at date & time [${timestamp}] `);
    console.log('Request Method:', req.method);
    console.log('Requested URL:', req.originalUrl);
    console.log('Request Body (if any):', req.body);
    console.log('Device Name:', req.headers['user-agent']);
    
    res.on('finish', () => {
        console.log(`Status code: ${res.statusCode}`);
    });

    next();
});

// Log request to CSV (users and locations)
app.use(['/users', '/locations'], function (req, res, next) {
    const logMessage = `\n\nRequest received for '${req.originalUrl}' endpoint\n` +
        `Request Method: ${req.method}\n` +
        `Requested URL: ${req.originalUrl}\n` +
        `Request Body (if any): ${JSON.stringify(req.body)}\n` +
        `Device Name: ${req.headers['user-agent']}`;

    const statusCodeMessage = `\nStatus code: ${res.statusCode}\n`;
    const filename = req.originalUrl.includes('/users') ? 'UsersLog.csv' : 'LocationsLog.csv';

    fs.appendFile(filename, logMessage + statusCodeMessage, (err) => {
        if (err) {
            console.error('Error writing log to file:', err);
        }
    });

    next();
});


//---------------------------------------     USERS     -----------------------------------------

// Users - GET request - All userdata
app.get('/users', function (req, res) {
    const Users = [];

    fs.createReadStream(__dirname + "/Users.csv")
        .pipe(csv())
        .on('data', (row) => {
            Users.push(row);
        })
        .on('end', () => {
            res.status(200).json(Users);
        })
        .on('error', (err) => {
            console.error('Error reading users data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

// Users - GET Specific Userdata by UserID
app.get('/users/:id', function (req, res) {
    const userId = req.params.id;
    let userFound = false;

    // Find user with ID
    let foundUser = null;
    fs.createReadStream(__dirname + "/Users.csv")
        .pipe(csv())
        .on('data', (row) => {
            if (!userFound && row.UserID === userId) {
                foundUser = row;
                userFound = true; // User found 
            }
        })
        .on('end', () => {
            if (foundUser) {
                res.status(200).json(foundUser);
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        })
        .on('error', (err) => {
            console.error('Error reading data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

// Users - POST Create User 
app.post('/users', function (req, res) {
    const newUser = req.body;

    if (!newUser || !newUser.Name || !newUser.Surname || !newUser.Phone || !newUser.Address || !newUser.Username || !newUser.Passcode) {
        return res.status(400).json({ error: 'Missing fields in request body' });
    }

    let lastUserID = 0;
    fs.createReadStream(__dirname + "/Users.csv")
        .pipe(csv())
        .on('data', (row) => {
            lastUserID = Math.max(lastUserID, parseInt(row.UserID.slice(1)));
        })
        .on('end', () => {
            const newUserID = `U${String(lastUserID + 1).padStart(3, '0')}`; 
            const newUserLine = `\n${newUserID},${newUser.Name},${newUser.Surname},${newUser.Phone},${newUser.Address},${newUser.Username},${newUser.Passcode}`;
            
            fs.appendFile(__dirname + "/Users.csv", newUserLine, (err) => {
                if (err) {
                    console.error('Error creating user:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    res.status(201).json({ message: 'User created successfully', UserID: newUserID });
                }
            });
        })
        .on('error', (err) => {
            console.error('Error reading users data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        }); 
//curl -X POST -H "Content-Type: application/json" -d "{\"Name\":\"John\", \"Surname\":\"Doe\", \"Phone\":\"123456789\", \"Address\":\"123 Main Street\", \"Username\":\"johndoe\", \"Passcode\":\"securePassword123\"}" http://localhost:5000/users
});

//--------------------------------------     LOG IN     -----------------------------------------

// Users - POST Login
app.post('/login', function (req, res) {
    const { Username, Passcode } = req.body;
    const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    let userFound = false;
    let userData = null;

    console.log(`\nLogin attempt at [${timestamp}]`);
    console.log(`Username: ${Username}`);
    console.log(`IP Address: ${req.ip}`);

    fs.createReadStream(__dirname + "/Users.csv")
        .pipe(csv())
        .on('data', (row) => {
            if (!userFound && row.Username === Username && row.Passcode === Passcode) {
                userFound = true;
                userData = { UserID: row.UserID, Name: row.Name, Surname: row.Surname };
            }
        })
        .on('end', () => {
            if (userFound) {
                console.log(`Login successful for ${Username}`);
                res.status(200).json({ message: 'Login successful AF', user: userData });
            } else {
                console.log(`Login failed for ${Username}`);
                res.status(401).json({ error: 'Invalid credentials. Try again Mr. VEPS user' });
            }
        })
        .on('error', (err) => {
            console.error('Error during login:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

//--------------------------------------     LOCATION     -----------------------------------------

// Location - GET all locations
app.get('/locations', function (req, res) {
    const Locations = [];

    fs.createReadStream(__dirname + "/Locations.csv")
        .pipe(csv())
        .on('data', (row) => {
            Locations.push(row);
        })
        .on('end', () => {
            res.status(200).json(Locations); 
        })
        .on('error', (err) => {
            console.error('Error reading locations data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

// Location - GET Specific Unit 
app.get('/locations/:unitID', function (req, res) {
    const unitID = req.params.unitID; 
    let unitFound = false;
    let foundUnit = null;

    fs.createReadStream(__dirname + "/Locations.csv")
        .pipe(csv())
        .on('data', (row) => {
            if (!unitFound && row.UnitID === unitID) {
                foundUnit = row;
                unitFound = true; 
            }
        })
        .on('end', () => {
            if (foundUnit) {
                res.status(200).json(foundUnit);
            } else {
                res.status(404).json({ error: 'Location not found' });
            }
        })
        .on('error', (err) => {
            console.error('Error reading locations data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

// Location - GET Specific Location by Name
app.get('/locations/name/:locationName', function (req, res) {
    const locationName = req.params.locationName.toLowerCase();
    const foundLocations = [];

    fs.createReadStream(__dirname + "/Locations.csv")
        .pipe(csv())
        .on('data', (row) => {
            // Check if row.Locations exists before accessing it
            if (row.Locations && row.Locations.toLowerCase() === locationName) {
                foundLocations.push(row);
            }
        })
        .on('end', () => {
            if (foundLocations.length > 0) {
                res.status(200).json(foundLocations);
            } else {
                res.status(404).json({ error: 'Location not found' });
            }
        })
        .on('error', (err) => {
            console.error('Error reading locations data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
        //http://localhost:5000/locations/name/drammen
});

// Location - PUT Update Location Status
app.put('/locations/:unitID', function (req, res) {
    const unitID = req.params.unitID.toUpperCase(); // Always ensure that we have a big letter (D001, instead of d001 etc.. )
    const { Status } = req.body;

    if (!Status || !['U', 'A'].includes(Status)) {
        return res.status(400).json({ error: 'Invalid status. Status must be either "U" or "A"' });
    }

    const updatedLocations = [];
    let locationFound = false;

    fs.createReadStream(__dirname + "/Locations.csv")
        .pipe(csv())
        .on('data', (row) => {
            if (row.UnitID === unitID) { 
                locationFound = true;
                // Update the status of the current location
                row.Status = Status;
            }
            updatedLocations.push(row);
        })
        .on('end', () => {
            if (!locationFound) {
                return res.status(404).json({ error: 'Location not found' });
            }

            // Write the updated locations back to the CSV file
            const writeStream = fs.createWriteStream(__dirname + "/Locations.csv");
            writeStream.write('UnitID,Locations,Status\n');

            updatedLocations.forEach(location => {
                writeStream.write(`${location.UnitID},${location.Locations},${location.Status}\n`); 
            });

            writeStream.end();

            writeStream.on('finish', () => {
                res.status(200).json({ message: 'Location status updated successfully', UnitID: unitID, Status: Status });
            });
        })
        .on('error', (err) => {
            console.error('Error reading locations data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
//test 
//curl -X PUT -H "Content-Type: application/json" -d "{\"Status\":\"U\"}" http://localhost:5000/locations/D001

});

// Location - POST New Location
app.post('/locations', function (req, res) {
    const newLocation = req.body;

    if (!newLocation || !newLocation.Location || !newLocation.Status) {
        return res.status(400).json({ error: 'Missing required fields in request' });
    }

    const allowedLocations = ['Drammen', 'Oslo'];

    if (!allowedLocations.includes(newLocation.Location.trim())) {
        return res.status(400).json({ error: 'Location must be either Drammen or Oslo' });
    }

    let lastUnitID = 0;

    fs.createReadStream(__dirname + "/Locations.csv")
        .pipe(csv())
        .on('data', (row) => {
            if (allowedLocations.includes(row.Locations)) {
                const numericPart = parseInt(row.UnitID.slice(1)); 
                lastUnitID = Math.max(lastUnitID, numericPart);
            }
        })
        .on('end', () => {
            const newUnitID = `D${String(lastUnitID + 1).padStart(3, '0')}`;

            // Add new location with the generated UnitID to the CSV file
            fs.appendFile(__dirname + "/Locations.csv", `\n${newUnitID},${newLocation.Location},${newLocation.Status}`, (err) => {
                if (err) {
                    console.error('Error creating location:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    res.status(201).json({ message: 'Location created successfully', UnitID: newUnitID });
                }
            });
        })
        .on('error', (err) => {
            console.error('Error reading locations data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
        //test
        //curl -X POST -H "Content-Type: application/json" -d "{\"Location\":\"Oslo\",\"Status\":\"A\"}" http://localhost:5000/locations
});

//--------------------------------------     Reservation     -----------------------------------------

// Reservation - GET all reservations
app.get('/reservations', function (req, res) {
    const Reservations = [];

    fs.createReadStream(__dirname + "/Reservations.csv")
        .pipe(csv())
        .on('data', (row) => {
            Reservations.push(row);
        })
        .on('end', () => {
            res.status(200).json(Reservations); 
        })
        .on('error', (err) => {
            console.error('Error reading reservations data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

// Reservation - GET the specific ReservationID and the info 
app.get('/reservations/:reservationID', function (req, res) {
    const reservationID = req.params.reservationID;
    let foundReservation = null;

    fs.createReadStream(__dirname + "/Reservations.csv")
        .pipe(csv())
        .on('data', (row) => {
            if (row.ReservationID === reservationID) {
                foundReservation = row;
            }
        })
        .on('end', () => {
            if (foundReservation) {
                res.status(200).json(foundReservation);
            } else {
                res.status(404).json({ error: 'Reservation not found' });
            }
        })
        .on('error', (err) => {
            console.error('Error reading reservations data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
});

//POST new reservation, also  check if the reservation is there from before within the time given and then change the value from locations.csv to U. 
app.post('/reservations', function (req, res) {
    const newReservation = req.body;

    if (!newReservation || !newReservation.UserID || !newReservation.Location || !newReservation.UnitID || !newReservation.Reserved_from || !newReservation.Reserved_to) {
        return res.status(400).json({ error: 'Missing required fields in request body' });
    }

    const requestedFromTime = new Date('1970-01-01T' + newReservation.Reserved_from + 'Z');
    const requestedToTime = new Date('1970-01-01T' + newReservation.Reserved_to + 'Z');

    let conflict = false;

    fs.createReadStream(__dirname + "/Reservations.csv")
        .pipe(csv())
        .on('data', (row) => {
            if (row.UnitID === newReservation.UnitID && row.Status === 'Active') {
                const existingFromTime = new Date('1970-01-01T' + row.Reserved_from + 'Z');
                const existingToTime = new Date('1970-01-01T' + row.Reserved_to + 'Z');

                if ((requestedFromTime >= existingFromTime && requestedFromTime < existingToTime) || 
                    (requestedToTime > existingFromTime && requestedToTime <= existingToTime) ||
                    (requestedFromTime <= existingFromTime && requestedToTime >= existingToTime)) {
                    conflict = true;
                }
            }
        })
        .on('end', () => {
            if (conflict) {
                return res.status(409).json({ error: 'Reservation time conflicts with an existing reservation.' });
            } else {
                const currentDate = new Date();
                newReservation.Date = currentDate.toISOString().split('T')[0];
                newReservation.Time = currentDate.toTimeString().split(' ')[0];

                let lastReservationID = 0;

                fs.createReadStream(__dirname + "/Reservations.csv")
                    .pipe(csv())
                    .on('data', (row) => {
                        if (row.ReservationID) {
                            const currentID = parseInt(row.ReservationID.substring(1), 10);
                            lastReservationID = Math.max(lastReservationID, currentID);
                        }
                    })
                    .on('end', () => {
                        const newReservationID = 'R' + String(lastReservationID + 1).padStart(3, '0');
                        const newLine = `\n${newReservationID},${newReservation.UserID},${newReservation.Location},${newReservation.UnitID},${newReservation.Date},${newReservation.Time},${newReservation.Reserved_from},${newReservation.Reserved_to},Active`;
                        fs.appendFile(__dirname + "/Reservations.csv", newLine, (err) => {
                            if (err) {
                                console.error('Error creating reservation:', err);
                                res.status(500).json({ error: 'Internal Server Error' });
                            } else {
                                // After appending new reservation, now update location status to U
                                const unitID = newReservation.UnitID.toUpperCase(); // Ensure conversion to uppercase
                                const updatedLocations = [];
                                let locationFound = false;

                                fs.createReadStream(__dirname + "/Locations.csv")
                                    .pipe(csv())
                                    .on('data', (row) => {
                                        if (row.UnitID === unitID) { 
                                            locationFound = true;
                                            row.Status = 'U'; // Mark as unavailable
                                        }
                                        updatedLocations.push(row);
                                    })
                                    .on('end', () => {
                                        if (!locationFound) {
                                            return res.status(404).json({ error: 'Location not found' });
                                        }
                                        const writeStream = fs.createWriteStream(__dirname + "/Locations.csv");
                                        writeStream.write('UnitID,Locations,Status\n');

                                        updatedLocations.forEach(location => {
                                            writeStream.write(`${location.UnitID},${location.Locations},${location.Status}\n`); 
                                        });

                                        writeStream.end();

                                        writeStream.on('finish', () => {
                                            res.status(201).json({ message: 'Reservation created successfully', ReservationID: newReservationID });
                                        });
                                    })
                                    .on('error', (err) => {
                                        console.error('Error reading locations data:', err);
                                        res.status(500).json({ error: 'Internal Server Error' });
                                    });
                            }
                        });
                    })
                    .on('error', (err) => {
                        console.error('Error reading reservations data:', err);
                        res.status(500).json({ error: 'Internal Server Error' });
                    });
            }
        })
        .on('error', (err) => {
            console.error('Error reading reservations data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
/*
Method to insert a new reservation using this format: 
//curl -X POST -H "Content-Type: application/json" -d "{\"UserID\":\"U001\",\"Location\":\"Oslo\",\"UnitID\":\"D003\",\"Reserved_from\":\"18:00\",\"Reserved_to\":\"20:00\"}" http://localhost:5000/reservations
*/

});

// Reservation - Deactivate/finish the reservation
app.put('/reservations/:reservationID', function (req, res) {
    const reservationID = req.params.reservationID;
    const reservations = [];
    let reservationFound = false;

    fs.createReadStream(__dirname + "/Reservations.csv")
        .pipe(csv())
        .on('data', (row) => {
            if (row.ReservationID === reservationID) {
                // Update the status of the reservation to 'Finished'
                row.Status = 'Finished';
                reservationFound = true;

                // Update Location status to 'A' from 'U', to indicate that it is not possible to reserve this Unit. 
                const locations = [];
                fs.createReadStream(__dirname + "/Locations.csv")
                    .pipe(csv())
                    .on('data', (locationRow) => {
                        if (locationRow.UnitID === row.UnitID && locationRow.Status === 'U') {
                            locationRow.Status = 'A';
                        }
                        locations.push(locationRow);
                    })
                    .on('end', () => {
                        const writeStream = fs.createWriteStream(__dirname + "/Locations.csv");
                        writeStream.write('UnitID,Locations,Status\n');
                        locations.forEach(location => {
                            writeStream.write(`${location.UnitID},${location.Locations},${location.Status}\n`);
                        });
                        writeStream.end();
                    })
                    .on('error', (err) => {
                        console.error('Error updating location status:', err);
                    });
            }
            reservations.push(row);
        })
        .on('end', () => {
            if (!reservationFound) {
                return res.status(404).json({ error: 'Reservation not found' });
            }
            // Write the updated reservations back to the CSV
            const writeStream = fs.createWriteStream(__dirname + "/Reservations.csv");
            writeStream.write('ReservationID,UserID,Location,UnitID,Date,Time,Reserved_from,Reserved_to,Status\n');

            reservations.forEach(reservation => {
                if (reservation.ReservationID) {
                    writeStream.write(`${reservation.ReservationID},${reservation.UserID},${reservation.Location},${reservation.UnitID},${reservation.Date},${reservation.Time},${reservation.Reserved_from},${reservation.Reserved_to},${reservation.Status}\n`);
                }
            });

            writeStream.end();

            writeStream.on('finish', () => {
                res.status(200).json({ message: 'Reservation status updated successfully', ReservationID: reservationID });
            });
        })
        .on('error', (err) => {
            console.error('Error reading reservations data:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
//
//curl -X PUT -H "Content-Type: application/json" -d "{\"Status\":\"finished\"}" http://localhost:5000/reservations/R002 
});

//--------------------------------------     Reservation     -----------------------------------------

// Default route to main website
app.get('/', function (req, res) {
    const routes = {
        users: {
            getAllUsers: 'GET /users',
            getSpecificUser: 'GET /users/INSERT USER ID',
            createUser: 'POST /users',
        },
        locations: {
            getAllLocations: 'GET /locations',
            getSpecificLocation: 'GET /locations/INSERT UNIT ID',
            createLocation: 'POST /locations',
        },
        reservations: {
            getAllReservations: 'GET /reservations',
            createReservation: 'POST /reservations',
        }
    };

    let message = '<html><head><title>Available Routes</title></head><body>';
    message += '<h1>Welcome to the Vertical Environmental Parking Solutions Server!</h1>';
    message += '<h2>Available Routes:</h2>';

    message += '<p>Here you can use the ordinary CRUD operations such as GET, POST, and UPDATE for each route. <br>';
    message += 'For illustration purposes, you can use this to enter users. <br>';
    message += '<strong>http://192.168.172.253:5000/users/</strong></p>';

    for (const category in routes) {
        message += `<h3>${category}:</h3>`;
        message += '<ul>';
        for (const route in routes[category]) {
            message += `<li>${routes[category][route]}</li>`;
        }
        message += '</ul>';
    }

    message += '</body></html>';

    res.status(200).send(message);
});

//--------------------------------------     INITIATE SERVER     -----------------------------------------
// Initialize the server
const PORT = 5000;
app.listen(PORT, function () {
    console.log(`Server is running on http://localhost:${PORT}`);
});