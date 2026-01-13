"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const types_1 = require("../../types/index.js");
const Bot_1 = require("./Bot.js");
class Service extends types_1.MessengerService {
    getName() {
        return 'max';
    }
    createBot(name, config, events = []) {
        return new Bot_1.MaxBot(name, config, events, this);
    }
}
exports.Service = Service;
