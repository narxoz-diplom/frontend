import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { searchMaterials, SEARCH_MIN_QUERY_LENGTH } from '@/shared/api/searchApi'

const SEARCH_GROUP_ORDER = ['course', 'lesson', 'test']
const SEARCH_DEBOUNCE_MS = 250

const getSearchResultTarget = (item) => {
    if (!item?.courseId) {
        return '/courses'
    }
    if (item.type === 'lesson' && item.lessonId) {
        return `/courses/${item.courseId}?lessonId=${item.lessonId}`
    }
    if (item.type === 'test' && item.testId) {
        return `/courses/${item.courseId}?testId=${item.testId}`
    }
    return `/courses/${item.courseId}`
}

const useGlobalSearch = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const searchRef = useRef(null)
    const searchRequestIdRef = useRef(0)

    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState('')
    const [searchOpen, setSearchOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)

    useEffect(() => {
        setSearchOpen(false)
    }, [location.pathname])

    useEffect(() => {
        const query = searchQuery.trim()
        if (!query || query.length < SEARCH_MIN_QUERY_LENGTH) {
            searchRequestIdRef.current += 1
            setSearchResults([])
            setSearchError('')
            setSearchLoading(false)
            setHighlightedIndex(-1)
            return
        }

        const requestId = ++searchRequestIdRef.current
        const timeoutId = window.setTimeout(async () => {
            setSearchLoading(true)
            setSearchError('')
            setSearchOpen(true)

            try {
                const results = await searchMaterials(query)
                if (searchRequestIdRef.current !== requestId) {
                    return
                }
                setSearchResults(results)
                setHighlightedIndex(results.length > 0 ? 0 : -1)
            } catch {
                if (searchRequestIdRef.current !== requestId) {
                    return
                }
                setSearchResults([])
                setHighlightedIndex(-1)
                setSearchError(t('searchUi.error'))
            } finally {
                if (searchRequestIdRef.current === requestId) {
                    setSearchLoading(false)
                }
            }
        }, SEARCH_DEBOUNCE_MS)

        return () => window.clearTimeout(timeoutId)
    }, [searchQuery, t])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchOpen(false)
                setHighlightedIndex(-1)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const resetSearch = useCallback(() => {
        searchRequestIdRef.current += 1
        setSearchQuery('')
        setSearchResults([])
        setSearchError('')
        setSearchLoading(false)
        setSearchOpen(false)
        setHighlightedIndex(-1)
    }, [])

    const handleSelectSearchResult = useCallback((item) => {
        resetSearch()
        navigate(getSearchResultTarget(item))
    }, [navigate, resetSearch])

    const groupedSearchResults = useMemo(() => {
        let optionIndex = 0

        return SEARCH_GROUP_ORDER
            .map((type) => {
                const items = searchResults
                    .filter(item => item.type === type)
                    .map(item => ({
                        ...item,
                        optionIndex: optionIndex++
                    }))

                return { type, items }
            })
            .filter(group => group.items.length > 0)
    }, [searchResults])

    const flattenedSearchResults = useMemo(
        () => groupedSearchResults.flatMap(group => group.items),
        [groupedSearchResults]
    )

    const showSearchDropdown = searchOpen && (
        Boolean(searchQuery.trim()) ||
        searchLoading ||
        Boolean(searchError) ||
        searchResults.length > 0
    )

    const handleSearchKeyDown = (event) => {
        if (!showSearchDropdown && event.key !== 'Escape') {
            setSearchOpen(true)
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (!flattenedSearchResults.length) return
            setHighlightedIndex((prev) => (prev + 1) % flattenedSearchResults.length)
            return
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault()
            if (!flattenedSearchResults.length) return
            setHighlightedIndex((prev) => (prev <= 0 ? flattenedSearchResults.length - 1 : prev - 1))
            return
        }

        if (event.key === 'Enter') {
            const selectedItem = highlightedIndex >= 0
                ? flattenedSearchResults[highlightedIndex]
                : flattenedSearchResults[0]
            if (!selectedItem) {
                return
            }
            event.preventDefault()
            handleSelectSearchResult(selectedItem)
            return
        }

        if (event.key === 'Escape') {
            setSearchOpen(false)
            setHighlightedIndex(-1)
        }
    }

    return {
        searchRef,
        searchQuery,
        setSearchQuery,
        setSearchOpen,
        searchLoading,
        searchError,
        showSearchDropdown,
        groupedSearchResults,
        highlightedIndex,
        setHighlightedIndex,
        resetSearch,
        handleSelectSearchResult,
        handleSearchKeyDown
    }
}

export default useGlobalSearch
