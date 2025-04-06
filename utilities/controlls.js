/**
 * @description This file contains the controls for the screen size
 * @author MinjaBaraka (https://github.com/MinjaBaraka)
 * @version 1.0.0
 * @since 1.0.0
 */
import { ref } from "vue";

const isGreaterToXL = ref(false); // check if the screen size is greater to xl
const isGreaterToLG = ref(false); // check if the screen size is greater to lg
const isGreaterToMD = ref(false); // check if the screen size is greater to md
const isGreaterToSM = ref(false); // check if the screen size is greater to sm
const isGreaterToXS = ref(false); // check if the screen size is greater to xs


// restriction message control
const isPopUp = ref(false)
const popMessage= ref()
const screenWidth = ref(0)

const experimrntUrl = ref();

const currentTopic = ref();
const _BASE_API_URL = ref()

export {
    isGreaterToXL,
    isGreaterToLG,
    isGreaterToMD,
    isGreaterToSM,
    isGreaterToXS,
    screenWidth,
    isPopUp,
    popMessage,
    experimrntUrl,
    _BASE_API_URL,
    currentTopic,
}