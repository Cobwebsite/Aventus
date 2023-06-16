import { Client } from "./Client";

const dataClasses: { [key: string]: string[] } = {};
const allBuilds: { [key: string]: string[] } = {};
const allStatics: { [key: string]: string[] } = {};
const client : Client = new Client();


export const Singleton = {
    client,
    allBuilds,
    allStatics,
    dataClasses
}