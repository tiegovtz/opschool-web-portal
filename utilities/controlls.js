/**
 * @description This file contains the controls for the screen size
 * @author MinjaBaraka (https://github.com/MinjaBaraka)
 * @version 1.0.0
 * @since 1.0.0
 */

const isGreaterToXL = ref(false); // check if the screen size is greater to xl
const isGreaterToLG = ref(false); // check if the screen size is greater to lg
const isGreaterToMD = ref(false); // check if the screen size is greater to md
const isGreaterToSM = ref(false); // check if the screen size is greater to sm
const isGreaterToXS = ref(false); // check if the screen size is greater to xs

const screenWidth = ref(0)

// urls
const baseUrl = 'https://api.smartdarasa.com/'
export {
    isGreaterToXL,
    isGreaterToLG,
    isGreaterToMD,
    isGreaterToSM,
    isGreaterToXS,
    screenWidth,
    baseUrl
}