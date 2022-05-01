import mongoose from 'mongoose';

const appDB = mongoose.connection.useDb('polymap');

const SharedRoute = new mongoose.Schema({
    from: String,
    to: String,
    asphalt: Boolean,
    serviceRoute: Boolean,
    allowParameterChange: Boolean,
    codeType: {
        type: String,
        enum: ['qr', 'appclip'],
        default: 'appclip'
    },
    helloText: String,
    codeID: String,
})


appDB.model("sharedRoute", SharedRoute);

export default appDB
