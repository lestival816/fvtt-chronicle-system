/**
 * Utility for logging messages to the console
 */

import { CS_CONSTANTS } from "../helpers/constants.mjs";

/**
 * A static utility class for logging messages to the console, controlled by a World setting.
 * All methods are static and can be called directly on the class (e.g., LOGGER.debug(...)).
 */
export default class LOGGER {

    /**
     * Returns the logging prefix based on the system name constant.
     * @returns {string}
     */
    static get LOG_PREFIX() {
        return `${CS_CONSTANTS.Settings.SYSTEM_NAME} |`;
    }

    /**
     * Checks the game settings to see if debug logging is enabled.
     * @returns {boolean} 
     */
    static getDebugStatus() {
        if (!game || !game.settings || !game.settings.get) {
            return false;
        }
        return game.settings.get(CS_CONSTANTS.Settings.SYSTEM_NAME, CS_CONSTANTS.Settings.DEBUG_LOGS);
    }

    /**
     * Standard log output (displayed only if debug logs are enabled).
     * @param {*} args
     */
    static log(...args) {
        if (this.getDebugStatus()) {
            console.log(LOGGER.LOG_PREFIX, "LOG |",...args);
        }
    }

    /**
     * Debug log output (displayed only if debug logs are enabled).
     * @param {*} args
     */
    static debug(...args) {
        if (this.getDebugStatus()) {
            console.debug(LOGGER.LOG_PREFIX, "DEBUG |",...args);
        }
    }

    /**
     * Informational log output (always displayed).
     * @param {*} args
     */
    static info(...args) {
        console.info(LOGGER.LOG_PREFIX, "INFO |",...args);
    }

    /**
     * Warning log output (always displayed).
     * @param {*} args
     */
    static warn(...args) {
        console.warn(LOGGER.LOG_PREFIX, "WARNING |",...args);
    }

    /**
     * Error log output (always displayed).
     * @param {*} args
     */
    static error(...args) {
        console.error(LOGGER.LOG_PREFIX, "ERROR |",...args);
    }
}