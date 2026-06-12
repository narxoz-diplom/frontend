import React from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import { SEARCH_MIN_QUERY_LENGTH } from '@/shared/api/searchApi'
import { pickLocalized } from '@/i18n/localize'
import useGlobalSearch from '../hooks/useGlobalSearch'

const getSearchGroupLabel = (type, t) => {
    if (type === 'course') return t('common.courses')
    if (type === 'lesson') return t('common.lessons')
    return t('common.tests')
}

const SearchBox = () => {
    const { t } = useTranslation()
    const {
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
    } = useGlobalSearch()

    return (
        <div
            className={`top-search ${showSearchDropdown ? 'is-open' : ''}`}
            ref={searchRef}
        >
            <FiSearch className="search-icon" />
            <input
                type="search"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(event) => {
                    setSearchQuery(event.target.value)
                    setSearchOpen(true)
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                aria-label={t('common.search')}
                aria-expanded={showSearchDropdown}
                aria-controls="global-search-results"
                aria-autocomplete="list"
            />
            {searchQuery && (
                <button
                    type="button"
                    className="top-search__clear"
                    onClick={resetSearch}
                    aria-label={t('searchUi.clear')}
                >
                    <FiX />
                </button>
            )}

            {showSearchDropdown && (
                <div className="top-search__dropdown" id="global-search-results" role="listbox">
                    {searchQuery.trim().length > 0 && searchQuery.trim().length < SEARCH_MIN_QUERY_LENGTH && (
                        <div className="top-search__state">{t('searchUi.minChars', { count: SEARCH_MIN_QUERY_LENGTH })}</div>
                    )}

                    {searchLoading && (
                        <div className="top-search__state">{t('searchUi.loading')}</div>
                    )}

                    {!searchLoading && searchError && (
                        <div className="top-search__state top-search__state--error">{searchError}</div>
                    )}

                    {!searchLoading && !searchError && searchQuery.trim().length >= SEARCH_MIN_QUERY_LENGTH && groupedSearchResults.length === 0 && (
                        <div className="top-search__state">{t('searchUi.empty')}</div>
                    )}

                    {!searchLoading && !searchError && groupedSearchResults.length > 0 && groupedSearchResults.map((group) => (
                        <div key={group.type} className="top-search__group">
                            <div className="top-search__group-title">{getSearchGroupLabel(group.type, t)}</div>
                            <div className="top-search__group-items">
                                {group.items.map((item) => {
                                    const title = pickLocalized(item, 'title') || t(`common.${item.type}`)
                                    const description = pickLocalized(item, 'description')
                                    const courseTitle = pickLocalized(item, 'courseTitle')
                                    const isActiveOption = item.optionIndex === highlightedIndex

                                    return (
                                        <button
                                            key={`${item.type}-${item.courseId}-${item.lessonId || item.testId || item.courseId}`}
                                            type="button"
                                            className={`top-search__result ${isActiveOption ? 'is-active' : ''}`}
                                            onClick={() => handleSelectSearchResult(item)}
                                            onMouseEnter={() => setHighlightedIndex(item.optionIndex)}
                                            onMouseDown={(event) => event.preventDefault()}
                                            role="option"
                                            aria-selected={isActiveOption}
                                        >
                                            <span className="top-search__badge">{t(`common.${item.type}`)}</span>
                                            <div className="top-search__result-body">
                                                <span className="top-search__result-title">{title}</span>
                                                {courseTitle && item.type !== 'course' && (
                                                    <span className="top-search__result-meta">
                                                        {t('searchUi.inCourse', { title: courseTitle })}
                                                    </span>
                                                )}
                                                {description && (
                                                    <span className="top-search__result-desc">{description}</span>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default SearchBox
