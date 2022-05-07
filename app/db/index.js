import mongoose from 'mongoose';

const appDB = mongoose.connection.useDb('polymap');

export const SharedRoute = appDB.model("sharedRoute", new mongoose.Schema({
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
}))

export const ReportIssueAnnotation = appDB.model("ReportIssueAnnotation", new mongoose.Schema({
    description: String,
    annotation: String,
    device: {
        locale: String, modelCode: String, orientation: String, os: String, appVersion: String, screen: String
    },
    date: Date
}))

export const ReportIssueRoute = appDB.model("ReportIssueRoute", new mongoose.Schema({
    description: String,
    route: {
        from: String,
        to: String,
        params: {
            asphalt: Boolean,
            serviceRoute: Boolean,
        }
    },
    device: {
        locale: String, modelCode: String, orientation: String, os: String, appVersion: String, screen: String
    },
    date: Date
}))

