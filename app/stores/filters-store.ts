import { defineStore } from 'pinia'
import { reactive } from 'vue'

export const useFilterStore = defineStore('filter', () => {
  // Reactive state
  const filters = reactive({
    level: null,
    standard: null,
    subject: null,
    topic: null
  })

  // Getter for filters
  const getFilters = () => filters
   // Getters for each filter
  const getLevel = () => filters.level
  const getStandard = () => filters.standard
  const getSubject = () => filters.subject
  const getTopic = () => filters.topic


  // Setter for filters
  const setFilters =( level: null, standard: null, subject: null, topic: null ) =>{
    filters.level = level
    filters.standard = standard
    filters.subject = subject
    filters.topic = topic
  }

  // Reset filters to null
  const resetFilters=()=> {
    filters.level = null
    filters.standard = null
    filters.subject = null
    filters.topic = null
  }

  return { getFilters, setFilters, resetFilters,getLevel,getStandard,getTopic,getSubject }
}, {
  persist: true // Enables persistence
})
