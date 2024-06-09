const mongoose = require('mongoose');


mongoose.connect(process.env.CONNECTION_MONGO)
    .then(() => console.log("Connected Successfully !!"))
    .catch((error) => console.log(error));


