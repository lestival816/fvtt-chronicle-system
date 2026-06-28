/**
 * This file defines user settings for the system module.
 */
import LOGGER from "../utils/logger.mjs";

import { CS_CONSTANTS } from "./constants.mjs";


const registerSystemSettings = () => {
    game.settings.register(CS_CONSTANTS.Settings.SYSTEM_NAME, CS_CONSTANTS.Settings.DEBUG_LOGS, {
        name: "GAME.SETTINGS.DebugLogs.name", 
        hint: "GAME.SETTINGS.DebugLogs.hint",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: (value) => {
            LOGGER.info(`${CS_CONSTANTS.Settings.DEBUG_LOGS} changed to ${value}`);
        }
    });
    game.settings.register(CS_CONSTANTS.Settings.SYSTEM_NAME, CS_CONSTANTS.Settings.CURRENT_VERSION, {
        name: "GAME.SETTINGS.CurrentVersion.name",
        scope: "world",
        config: true,
        type:String,
        default: game.system.version
    });
    
};

export default registerSystemSettings;

