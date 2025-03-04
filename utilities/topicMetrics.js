
/**
 * Calculate topic metrics
 * @param {number} value - The value to calculate
 * @returns {string} - The calculated value
 * @author MinjaBaraka (https://github.com/MinjaBaraka)
 * @description This function calculates the metrics of a topic
 * @version 1.0.0
 * @since 1.0.0
 * @example     
 * calculateTopicMetrics(1000) // "1K"
 * calculateTopicMetrics(1000000) // "1M"
 * calculateTopicMetrics(1000000000) // "1B"
 * calculateTopicMetrics(1000000000000) // "1T"
 */

const calculateTopicMetrics = (value) => {
    if (value < 1000) {
        return value
    } else if (value < 1000000) {
        return (value / 1000).toFixed(1) + 'K'
    } else if (value < 1000000000) {
        return (value / 1000000).toFixed(1) + 'M'
    } else if (value < 1000000000000) {
        return (value / 1000000000).toFixed(1) + 'B'
    } else {
        return (value / 1000000000000).toFixed(1) + 'T'
    }
}

export {
    calculateTopicMetrics
}